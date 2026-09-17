"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function AdminSyncPage() {
  const [businessId, setBusinessId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function addLog(line: string) {
    setLog((prev) => [line, ...prev]);
  }

  async function syncGadys() {
    setLoading(true);
    try {
      const res = await fetch("/api/sync/gadys-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId })
      });
      const data = await res.json();
      addLog(
        res.ok
          ? `Gadys Entreprise : ${data.created} créés, ${data.updated} mis à jour (${data.total} au total).`
          : `Erreur Gadys Entreprise : ${data.error}`
      );
    } catch {
      addLog("Erreur réseau lors de la synchronisation Gadys Entreprise.");
    } finally {
      setLoading(false);
    }
  }

  async function importCj() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/cj/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, markupPercent: 50 })
      });
      const data = await res.json();
      addLog(
        res.ok
          ? `CJ Dropshipping : ${data.imported} produit(s) importé(s) sur ${data.found} trouvé(s).`
          : `Erreur CJ Dropshipping : ${data.error}`
      );
    } catch {
      addLog("Erreur réseau lors de l'import CJ Dropshipping.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-gray p-6">
      <h1 className="font-display text-2xl font-bold text-brand-black">Synchronisations (admin)</h1>
      <p className="mt-1 text-sm text-brand-black/50">
        Page de test pour la Phase 1 — un vrai tableau de bord admin viendra dans une phase suivante.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display font-bold text-brand-black">Gadys Entreprise → Gadys Shop</h2>
          <p className="mt-1 text-xs text-brand-black/50">
            Importe le catalogue et le stock actuel d&apos;une entreprise Gadys Entreprise.
          </p>
          <Input
            className="mt-3"
            placeholder="ID de l'entreprise Gadys Entreprise"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
          <Button className="mt-3 w-full" onClick={syncGadys} disabled={loading || !businessId}>
            Synchroniser
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-bold text-brand-black">CJ Dropshipping → Gadys Shop</h2>
          <p className="mt-1 text-xs text-brand-black/50">
            Cherche et importe des produits CJ Dropshipping (nécessite CJ_EMAIL / CJ_API_KEY).
          </p>
          <Input
            className="mt-3"
            placeholder="Mot-clé (ex: phone case)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Button className="mt-3 w-full" onClick={importCj} disabled={loading || !keyword}>
            Importer
          </Button>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-display font-bold text-brand-black">Journal</h2>
        {log.length === 0 ? (
          <p className="mt-2 text-sm text-brand-black/40">Aucune action pour le moment.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-brand-black/70">
            {log.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
