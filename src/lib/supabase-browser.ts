import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase pour les composants client — respecte la session du navigateur. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
