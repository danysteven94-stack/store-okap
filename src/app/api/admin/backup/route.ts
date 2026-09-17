import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { exportAllData, createBackupSnapshot } from "@/lib/backup";

/** GET → liste les sauvegardes existantes, ou télécharge la dernière si ?download=1 */
export async function GET(req: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);

  if (searchParams.get("download") === "now") {
    const dump = await exportAllData();
    return new NextResponse(JSON.stringify(dump, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gadys-shop-backup-${dump.createdAt.slice(0, 10)}.json"`
      }
    });
  }

  const supabase = createSupabaseAdminClient();
  const { data: files } = await supabase.storage.from("backups").list("", { limit: 100 });
  const sorted = (files ?? []).sort((a, b) => (a.name < b.name ? 1 : -1));

  return NextResponse.json({ files: sorted.map((f) => f.name) });
}

/** POST → déclenche manuellement un instantané (identique au cron quotidien) */
export async function POST() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const fileName = await createBackupSnapshot();
  return NextResponse.json({ ok: true, fileName });
}
