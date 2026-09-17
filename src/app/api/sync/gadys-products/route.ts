import { NextResponse } from "next/server";
import { fetchGadysProducts } from "@/lib/gadys-connector";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { sendLowStockAlertEmail } from "@/lib/email";

/**
 * POST /api/sync/gadys-products
 * Déclenchée manuellement (bouton admin) ou par un cron Vercel — récupère
 * le catalogue + stock actuel depuis Gadys Entreprise et met à jour les
 * tables `products` et `inventory` dans Supabase. Gadys Entreprise reste la
 * source de vérité pour le stock ; cette route ne fait que refléter son état.
 */
export async function POST(req: Request) {
  const { businessId } = await req.json();
  if (!businessId) return NextResponse.json({ error: "businessId requis" }, { status: 400 });

  let gadysProducts;
  try {
    gadysProducts = await fetchGadysProducts(businessId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Échec de connexion à Gadys Entreprise." },
      { status: 502 }
    );
  }

  const supabase = createSupabaseAdminClient();
  let created = 0;
  let updated = 0;

  for (const gp of gadysProducts) {
    const slug = gp.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("external_id", gp.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("products")
        .update({
          name: gp.name,
          sale_price: gp.price,
          images: gp.imageUrl ? [gp.imageUrl] : [],
          description: gp.description ?? null,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id);

      const { data: existingInventory } = await supabase
        .from("inventory")
        .select("min_stock")
        .eq("product_id", existing.id)
        .maybeSingle();

      await supabase
        .from("inventory")
        .update({ quantity: gp.quantity, updated_at: new Date().toISOString() })
        .eq("product_id", existing.id);

      if (existingInventory && gp.quantity <= existingInventory.min_stock) {
        sendLowStockAlertEmail(gp.name, gp.quantity, existingInventory.min_stock).catch(() => {});
      }
      updated++;
    } else {
      const { data: inserted, error } = await supabase
        .from("products")
        .insert({
          name: gp.name,
          slug: `${slug}-${gp.id.slice(0, 6)}`,
          sale_price: gp.price,
          purchase_price: 0,
          images: gp.imageUrl ? [gp.imageUrl] : [],
          description: gp.description ?? null,
          external_id: gp.id,
          is_active: true
        })
        .select("id")
        .single();

      if (!error && inserted) {
        await supabase.from("inventory").insert({
          product_id: inserted.id,
          quantity: gp.quantity,
          gadys_business_id: businessId,
          gadys_product_id: gp.id
        });
        created++;
      }
    }
  }

  return NextResponse.json({ ok: true, created, updated, total: gadysProducts.length });
}
