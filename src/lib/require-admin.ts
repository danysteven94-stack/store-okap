import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase-server";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin" | "staff";
}

/**
 * Vérifie qu'une session Supabase valide existe ET correspond à une ligne
 * dans la table `users` (admin/staff) — un compte client (`customers`)
 * connecté ne passe pas cette vérification. Redirige vers /admin/connexion
 * sinon. À appeler dans le layout du groupe protégé (dashboard).
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/connexion");

  const { data: adminRow } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    redirect("/admin/connexion?error=not_admin");
  }

  return {
    id: adminRow.id,
    email: adminRow.email,
    fullName: adminRow.full_name,
    role: adminRow.role
  };
}
