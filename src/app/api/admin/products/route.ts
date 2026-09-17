import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin-api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const createSchema = z.object({
  sku: z.string().optional().or(z.literal("")),
  name: z.string().min(1),
  categoryId: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  purchasePrice: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional(),
  images: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  quantity: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(5)
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, inventory(quantity, min_stock), categories(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const baseSlug = slugify(parsed.data.name);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      sku: parsed.data.sku || null,
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      category_id: parsed.data.categoryId || null,
      purchase_price: parsed.data.purchasePrice,
      sale_price: parsed.data.salePrice,
      compare_at_price: parsed.data.compareAtPrice || null,
      images: parsed.data.images,
      is_featured: parsed.data.isFeatured,
      is_active: parsed.data.isActive
    })
    .select()
    .single();

  if (error || !product) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });

  await supabase.from("inventory").insert({
    product_id: product.id,
    quantity: parsed.data.quantity,
    min_stock: parsed.data.minStock
  });

  return NextResponse.json({ product }, { status: 201 });
}
