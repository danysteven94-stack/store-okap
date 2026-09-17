import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin-api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const patchSchema = z.object({
  sku: z.string().optional().or(z.literal("")),
  name: z.string().min(1).optional(),
  categoryId: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  purchasePrice: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  quantity: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  const productPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.sku !== undefined) productPatch.sku = parsed.data.sku || null;
  if (parsed.data.name !== undefined) productPatch.name = parsed.data.name;
  if (parsed.data.categoryId !== undefined) productPatch.category_id = parsed.data.categoryId || null;
  if (parsed.data.description !== undefined) productPatch.description = parsed.data.description || null;
  if (parsed.data.purchasePrice !== undefined) productPatch.purchase_price = parsed.data.purchasePrice;
  if (parsed.data.salePrice !== undefined) productPatch.sale_price = parsed.data.salePrice;
  if (parsed.data.compareAtPrice !== undefined) productPatch.compare_at_price = parsed.data.compareAtPrice || null;
  if (parsed.data.images !== undefined) productPatch.images = parsed.data.images;
  if (parsed.data.isFeatured !== undefined) productPatch.is_featured = parsed.data.isFeatured;
  if (parsed.data.isActive !== undefined) productPatch.is_active = parsed.data.isActive;

  const { data: product, error } = await supabase
    .from("products")
    .update(productPatch)
    .eq("id", id)
    .select()
    .single();

  if (error || !product) return NextResponse.json({ error: error?.message ?? "Introuvable" }, { status: 404 });

  if (parsed.data.quantity !== undefined || parsed.data.minStock !== undefined) {
    const inventoryPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.quantity !== undefined) inventoryPatch.quantity = parsed.data.quantity;
    if (parsed.data.minStock !== undefined) inventoryPatch.min_stock = parsed.data.minStock;
    await supabase.from("inventory").update(inventoryPatch).eq("product_id", id);
  }

  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  await supabase.from("products").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
