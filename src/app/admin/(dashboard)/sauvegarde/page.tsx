"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ShieldCheck } from "lucide-react";

export default function AdminSauvegardePage() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/backup")
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreateNow() {
    setCreating(true);
    try {
      await fetch("/api/admin/backup", { method: "POST" });
      load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-black">Sauvegarde</h1>
        <p className="text-sm text-brand-black/50">
          Toutes les données vivent déjà dans Supabase, qui persiste indépendamment des
          redéploiements. Cette page ajoute une sécurité supplémentaire.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Sauvegarde manuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-brand-black/60">
              Télécharge immédiatement un export JSON complet (produits, commandes, clients, etc.).
            </p>
            <a href="/api/admin/backup?download=now">
              <Button type="button">
                <Download className="h-4 w-4" /> Télécharger maintenant
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="h-4 w-4" /> Sauvegarde automatique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-brand-black/60">
              Un instantané est créé chaque nuit (Vercel Cron). Les 30 derniers sont conservés.
            </p>
            <Button type="button" variant="outline" onClick={handleCreateNow} disabled={creating}>
              {creating ? "Création..." : "Créer un instantané maintenant"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instantanés disponibles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-sm text-brand-black/50">Chargement...</p>
          ) : files.length === 0 ? (
            <p className="p-5 text-sm text-brand-black/50">
              Aucun instantané pour le moment — le premier sera créé à la prochaine exécution du cron.
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {files.map((name) => (
                  <tr key={name} className="border-b border-brand-black/5 last:border-0">
                    <td className="px-5 py-2.5 font-mono text-xs text-brand-black/70">{name}</td>
                    <td className="px-5 py-2.5 text-right">
                      <a href={`/api/admin/backup/${name}`} className="text-brand-red hover:underline">
                        Télécharger
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
