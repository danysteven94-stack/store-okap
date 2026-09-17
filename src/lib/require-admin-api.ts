import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase-server";

export async function requireAdminApi(): Promise<NextResponse | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { data: adminRow } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!adminRow) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  return null;
}
