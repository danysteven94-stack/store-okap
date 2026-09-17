import { NextResponse } from "next/server";
import { createBackupSnapshot } from "@/lib/backup";

/**
 * Appelée automatiquement par Vercel Cron (voir vercel.json). Vercel ajoute
 * un en-tête `Authorization: Bearer $CRON_SECRET` lorsque la variable
 * d'environnement CRON_SECRET est définie sur le projet.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const fileName = await createBackupSnapshot();
  return NextResponse.json({ ok: true, fileName });
}
