"use client";

import { useEffect, useState } from "react";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const topLevel = categories.filter((c) => !c.parent_id);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parentId || undefined })
      });
      if (res.ok) {
        setName("");
        setParentId("");
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-black">Catégories</h1>
        <p className="text-sm text-brand-black/50">Organisez votre catalogue en catégories et sous-catégories.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvelle catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs font-medium text-brand-black/50">Nom</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vêtements" />
            </div>
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs font-medium text-brand-black/50">Catégorie parente (optionnel)</label>
              <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">— Aucune (catégorie principale) —</option>
                {topLevel.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-brand-black/50">Chargement...</p>
          ) : categories.length === 0 ? (
            <p className="p-6 text-sm text-brand-black/50">Aucune catégorie.</p>
          ) : (
            <div className="divide-y divide-brand-black/5">
              {topLevel.map((parent) => (
                <div key={parent.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-brand-black">{parent.name}</p>
                    <button
                      onClick={() => handleDelete(parent.id)}
                      className="rounded-lg p-1.5 text-brand-black/40 hover:bg-brand-red/10 hover:text-brand-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1.5 pl-4">
                    {categories
                      .filter((c) => c.parent_id === parent.id)
                      .map((child) => (
                        <div key={child.id} className="flex items-center justify-between text-sm text-brand-black/60">
                          <span>↳ {child.name}</span>
                          <button
                            onClick={() => handleDelete(child.id)}
                            className="rounded-lg p-1 text-brand-black/40 hover:bg-brand-red/10 hover:text-brand-red"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
