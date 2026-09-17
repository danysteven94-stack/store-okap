"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Category, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUploader } from "@/components/image-uploader";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Trash2, Plus, Search, Tags } from "lucide-react";

interface ProductRow extends Product {
  inventory: { quantity: number; min_stock: number } | { quantity: number; min_stock: number }[] | null;
  categories: { name: string } | null;
}

const emptyForm = {
  id: "",
  sku: "",
  name: "",
  categoryId: "",
  description: "",
  purchasePrice: "",
  salePrice: "",
  compareAtPrice: "",
  images: [] as string[],
  isFeatured: false,
  isActive: true,
  quantity: "",
  minStock: "5"
};

function getInventory(row: ProductRow) {
  if (!row.inventory) return { quantity: 0, min_stock: 5 };
  return Array.isArray(row.inventory) ? row.inventory[0] ?? { quantity: 0, min_stock: 5 } : row.inventory;
}

export default function AdminProduitsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/products").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json())
    ])
      .then(([p, c]) => {
        setProducts(p.products ?? []);
        setCategories(c.categories ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: ProductRow) {
    const inv = getInventory(p);
    setForm({
      id: p.id,
      sku: p.sku ?? "",
      name: p.name,
      categoryId: p.category_id ?? "",
      description: p.description ?? "",
      purchasePrice: String(p.purchase_price),
      salePrice: String(p.sale_price),
      compareAtPrice: p.compare_at_price ? String(p.compare_at_price) : "",
      images: p.images ?? [],
      isFeatured: p.is_featured,
      isActive: p.is_active,
      quantity: String(inv.quantity),
      minStock: String(inv.min_stock)
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      sku: form.sku,
      name: form.name,
      categoryId: form.categoryId,
      description: form.description,
      purchasePrice: Number(form.purchasePrice),
      salePrice: Number(form.salePrice),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      images: form.images,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      quantity: Number(form.quantity),
      minStock: Number(form.minStock)
    };

    try {
      const res = await fetch(form.id ? `/api/admin/products/${form.id}` : "/api/admin/products", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setError("Impossible d'enregistrer le produit.");
        return;
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ? Cette action est définitive.`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-black">Produits</h1>
          <p className="text-sm text-brand-black/50">Créez, modifiez et gérez le catalogue et le stock.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/produits/categories">
            <Button type="button" variant="outline">
              <Tags className="h-4 w-4" /> Catégories
            </Button>
          </Link>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouveau produit
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Photos</Label>
                <ImageUploader images={form.images} onChange={(images) => setForm({ ...form, images })} />
              </div>

              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>SKU (optionnel)</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">— Aucune —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? `↳ ${c.name}` : c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2 text-sm text-brand-black/70">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  En vedette
                </label>
                <label className="flex items-center gap-2 text-sm text-brand-black/70">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Actif (visible sur le site)
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>Prix d&apos;achat</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prix de vente</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prix barré (promo, optionnel)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.compareAtPrice}
                  onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                />
              </div>
              <div />

              <div className="space-y-1.5">
                <Label>Stock disponible</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Seuil de stock faible</Label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {error && <p className="text-sm text-brand-red sm:col-span-2">{error}</p>}

              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-black/30" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit ou SKU..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <p className="p-6 text-sm text-brand-black/50">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-brand-black/50">Aucun produit.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-wide text-brand-black/40">
                  <th className="px-5 py-3">Produit</th>
                  <th className="px-5 py-3">Catégorie</th>
                  <th className="px-5 py-3 text-right">Prix</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const inv = getInventory(p);
                  return (
                    <tr key={p.id} className="border-b border-brand-black/5 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {p.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt="" className="h-9 w-9 rounded-lg object-cover" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-brand-gray" />
                          )}
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-brand-black/60">{p.categories?.name ?? "—"}</td>
                      <td className="tabular-figures px-5 py-3 text-right font-medium">
                        {formatCurrency(p.sale_price)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`tabular-figures rounded-full px-2 py-0.5 text-xs font-medium ${
                            inv.quantity <= 0
                              ? "bg-brand-red/10 text-brand-red"
                              : inv.quantity <= inv.min_stock
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {inv.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-brand-black/5 text-brand-black/40"
                          }`}
                        >
                          {p.is_active ? "Actif" : "Masqué"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded-lg p-1.5 text-brand-black/50 hover:bg-brand-gray hover:text-brand-black"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="rounded-lg p-1.5 text-brand-black/50 hover:bg-brand-red/10 hover:text-brand-red"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
