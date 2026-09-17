import { createSupabaseAdminClient } from "./supabase-admin";

const TABLES = [
  "customers",
  "categories",
  "products",
  "inventory",
  "orders",
  "order_items",
  "invoices",
  "payments",
  "coupons",
  "suppliers",
  "reviews",
  "wishlist_items"
] as const;

export async function exportAllData() {
  const supabase = createSupabaseAdminClient();
  const dump: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const { data } = await supabase.from(table).select("*");
    dump[table] = data ?? [];
  }

  return { createdAt: new Date().toISOString(), tables: dump };
}

/** Sauvegarde le dump dans le bucket privé `backups` de Supabase Storage. */
export async function createBackupSnapshot(): Promise<string> {
  const dump = await exportAllData();
  const supabase = createSupabaseAdminClient();
  const fileName = `backup-${dump.createdAt.replace(/[:.]/g, "-")}.json`;

  await supabase.storage.from("backups").upload(fileName, JSON.stringify(dump, null, 2), {
    contentType: "application/json",
    upsert: false
  });

  // Ne garder que les 30 sauvegardes les plus récentes.
  const { data: files } = await supabase.storage.from("backups").list("", { limit: 1000 });
  if (files && files.length > 30) {
    const sorted = [...files].sort((a, b) => (a.name < b.name ? 1 : -1));
    const toDelete = sorted.slice(30).map((f) => f.name);
    if (toDelete.length) await supabase.storage.from("backups").remove(toDelete);
  }

  return fileName;
}
