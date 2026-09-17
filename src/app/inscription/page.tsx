"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InscriptionPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data.user) {
        await supabase.from("customers").insert({
          auth_user_id: data.user.id,
          email,
          full_name: fullName
        });
      }
      router.push("/");
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
        <h1 className="font-display text-xl font-bold text-brand-black">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input required placeholder="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
            minLength={6}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-brand-red">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-brand-black/50">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-brand-red hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
