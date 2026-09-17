import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/require-admin-api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const createSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional().or(z.literal(""))
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
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const slug = `${slugify(parsed.data.name)}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: category, error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name, slug, parent_id: parsed.data.parentId || null })
    .select()
    .single();

  if (error || !category) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });
  return NextResponse.json({ category }, { status: 201 });
}
