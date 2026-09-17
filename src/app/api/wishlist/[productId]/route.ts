import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!customer) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  await supabase.from("wishlist_items").delete().eq("customer_id", customer.id).eq("product_id", productId);
  return NextResponse.json({ ok: true });
}
