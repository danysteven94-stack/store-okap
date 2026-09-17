import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé service_role — contourne RLS entièrement.
 * JAMAIS importé dans un composant client ni exposé au navigateur : réservé
 * aux routes API serveur (webhooks, connecteur Gadys Entreprise, sync CJ).
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
