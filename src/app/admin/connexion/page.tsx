"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AdminConnexionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_admin" ? "Ce compte n'a pas les droits d'administration." : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      const { data: adminRow } = await supabase
        .from("users")
        .select("id")
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

      if (!adminRow) {
        await supabase.auth.signOut();
        setError("Ce compte n'a pas les droits d'administration.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Pas de connexion au serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-red font-display text-sm font-bold text-white">
            GS
          </div>
          <h1 className="font-display text-lg font-bold text-brand-black">Administration</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-brand-red">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminConnexionPage() {
  return (
    <Suspense>
      <AdminConnexionInner />
    </Suspense>
  );
}
