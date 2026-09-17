"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Printer } from "lucide-react";

const STATUS_TABS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "pending", label: "Nouvelles" },
  { value: "preparing", label: "En préparation" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" }
];

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-brand-red/10 text-brand-red"
};

interface OrderWithCustomer extends Order {
  customers?: { full_name: string | null; phone: string | null } | null;
}

export default function AdminCommandesPage() {
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const url = tab === "all" ? "/api/admin/orders" : `/api/admin/orders?status=${tab}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) return;
      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o)));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-black">Commandes</h1>
        <p className="text-sm text-brand-black/50">Suivez et mettez à jour le statut des commandes.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              tab === t.value ? "bg-brand-black text-white" : "bg-white text-brand-black/60 hover:bg-brand-gray"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <p className="p-6 text-sm text-brand-black/50">Chargement...</p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-sm text-brand-black/50">Aucune commande.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-black/10 text-left text-xs uppercase tracking-wide text-brand-black/40">
                  <th className="px-5 py-3">Commande</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-brand-black/5 last:border-0">
                    <td className="px-5 py-3 font-medium tabular-figures">{o.order_number}</td>
                    <td className="px-5 py-3 text-brand-black/60">{o.customers?.full_name ?? "Client"}</td>
                    <td className="tabular-figures px-5 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                    <td className="px-5 py-3">
                      <Select
                        value={o.status}
                        disabled={updating === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                        className={`h-8 w-40 text-xs font-medium ${STATUS_COLOR[o.status]}`}
                      >
                        <option value="pending">Nouvelle</option>
                        <option value="preparing">En préparation</option>
                        <option value="shipped">Expédiée</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-xs text-brand-black/40">
                      {new Date(o.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a href={`/api/admin/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer">
                        <Button type="button" variant="outline" size="sm">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
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
