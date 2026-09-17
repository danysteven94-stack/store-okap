import { NextResponse } from "next/server";
import { z } from "zod";
import { searchCjProducts } from "@/lib/cj-dropshipping";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const bodySchema = z.object({
  keyword: z.string().min(1),
  markupPercent: z.coerce.number().min(0).default(50) // marge appliquée au prix CJ pour définir sale_price
});

/**
 * POST /api/integrations/cj/sync
 * Cherche des produits chez CJ Dropshipping par mot-clé et les importe dans
 * le catalogue Supabase (products + inventory), avec une marge appliquée.
 * Nécessite CJ_EMAIL et CJ_API_KEY configurés (voir lib/cj-dropshipping.ts).
 */
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let cjProducts;
  try {
    cjProducts = await searchCjProducts(parsed.data.keyword);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Échec de connexion à CJ Dropshipping." },
      { status: 502 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("type", "cj_dropshipping")
    .maybeSingle();

  const supplierId =
    supplier?.id ??
    (
      await supabase
        .from("suppliers")
        .insert({ name: "CJ Dropshipping", type: "cj_dropshipping" })
        .select("id")
        .single()
    ).data?.id;

  let imported = 0;
  for (const p of cjProducts) {
    const purchasePrice = Number(p.sellPrice) || 0;
    const salePrice = Math.round(purchasePrice * (1 + parsed.data.markupPercent / 100));
    const slug = p.productName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("external_id", p.pid)
      .maybeSingle();

    if (existing) continue; // déjà importé — la mise à jour de prix se fait via une sync dédiée

    const { data: inserted } = await supabase
      .from("products")
      .insert({
        sku: p.productSku,
        name: p.productName,
        slug: `${slug}-${p.pid.slice(0, 6)}`,
        purchase_price: purchasePrice,
        sale_price: salePrice,
        images: p.productImage ? [p.productImage] : [],
        supplier_id: supplierId,
        external_id: p.pid,
        is_active: true
      })
      .select("id")
      .single();

    if (inserted) {
      await supabase.from("inventory").insert({ product_id: inserted.id, quantity: 999 }); // dropshipping: pas de stock physique local
      imported++;
    }
  }

  return NextResponse.json({ ok: true, imported, found: cjProducts.length });
}
