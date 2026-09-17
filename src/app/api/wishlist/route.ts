import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function getCustomerId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  return customer?.id ?? null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const customerId = await getCustomerId(supabase);
  if (!customerId) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*, products(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const customerId = await getCustomerId(supabase);
  if (!customerId) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId requis" }, { status: 400 });

  const { error } = await supabase
    .from("wishlist_items")
    .insert({ customer_id: customerId, product_id: productId });

  // Contrainte unique (customer_id, product_id) : déjà dans la liste n'est pas une erreur.
  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
