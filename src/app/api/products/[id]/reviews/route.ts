import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const createSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional()
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const average =
    reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return NextResponse.json({ reviews, average, count: reviews?.length ?? 0 });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  if (!user) return NextResponse.json({ error: "Connectez-vous pour laisser un avis." }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: customer } = await supabase.from("customers").select("id, full_name").eq("auth_user_id", user.id).maybeSingle();
  if (!customer) return NextResponse.json({ error: "Profil client introuvable." }, { status: 400 });

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      product_id: id,
      customer_id: customer.id,
      customer_name: customer.full_name ?? "Client",
      rating: parsed.data.rating,
      comment: parsed.data.comment || null
    })
    .select()
    .single();

  if (error) {
    const message = error.message.includes("duplicate")
      ? "Vous avez déjà laissé un avis pour ce produit."
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ review }, { status: 201 });
}
