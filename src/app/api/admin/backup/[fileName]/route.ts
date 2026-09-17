import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(_req: Request, { params }: { params: Promise<{ fileName: string }> }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { fileName } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from("backups").download(fileName);

  if (error || !data) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${fileName}"`
    }
  });
}
