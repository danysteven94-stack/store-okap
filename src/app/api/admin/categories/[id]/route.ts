import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  await supabase.from("categories").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
