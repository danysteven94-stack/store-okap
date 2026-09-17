import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderItem, Product } from "@/types";
import { Wallet, Users, Package, TrendingUp, ArrowUpRight } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pending: "Nouvelle",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée"
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  preparing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-brand-red/10 text-brand-red"
};

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default async function AdminDashboardPage() {
  const supabase = createSupabaseAdminClient();

  const [ordersRes, customersRes, productsRes, monthOrdersRes, recentOrdersRes] = await Promise.all([
    supabase.from("orders").select("total", { count: "exact" }).neq("status", "cancelled"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("orders").select("total").neq("status", "cancelled").gte("created_at", startOfMonth()),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<Order[]>()
  ]);

  const totalSales = (ordersRes.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = ordersRes.count ?? 0;
  const totalCustomers = customersRes.count ?? 0;
  const totalProducts = productsRes.count ?? 0;
  const revenueThisMonth = (monthOrdersRes.data ?? []).reduce((sum, o) => sum + Number(o.total), 0);
  const recentOrders = recentOrdersRes.data ?? [];

  // Top produits : agrégation simple à partir de order_items
  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, quantity, subtotal")
    .returns<Pick<OrderItem, "product_name" | "quantity" | "subtotal">[]>();

  const topMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of items ?? []) {
    const existing = topMap.get(item.product_name);
    if (existing) {
      existing.qty += item.quantity;
      existing.revenue += Number(item.subtotal);
    } else {
      topMap.set(item.product_name, { name: item.product_name, qty: item.quantity, revenue: Number(item.subtotal) });
    }
  }
  const topProducts = Array.from(topMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const KPIS = [
    { label: "Total des ventes", value: formatCurrency(totalSales), icon: Wallet, note: `${totalOrders} commande(s)` },
    { label: "Revenus du mois", value: formatCurrency(revenueThisMonth), icon: TrendingUp },
    { label: "Total clients", value: String(totalCustomers), icon: Users },
    { label: "Produits actifs", value: String(totalProducts), icon: Package }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-black">Tableau de bord</h1>
        <p className="text-sm text-brand-black/50">Vue d&apos;ensemble de la boutique.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-brand-black/50">{kpi.label}</CardTitle>
                <kpi.icon className="h-4 w-4 text-brand-black/30" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="tabular-figures font-display text-2xl font-bold text-brand-black">{kpi.value}</p>
              {kpi.note && <p className="mt-1 text-xs text-brand-black/40">{kpi.note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="p-5 text-sm text-brand-black/50">Aucune vente pour le moment.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {topProducts.map((p) => (
                    <tr key={p.name} className="border-b border-brand-black/5 px-5 last:border-0">
                      <td className="px-5 py-2.5 font-medium">{p.name}</td>
                      <td className="px-2 py-2.5 text-brand-black/50">{p.qty} vendu(s)</td>
                      <td className="px-5 py-2.5 text-right tabular-figures font-medium">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dernières commandes</CardTitle>
              <Link href="/admin/commandes" className="flex items-center gap-1 text-xs text-brand-red hover:underline">
                Tout voir <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="p-5 text-sm text-brand-black/50">Aucune commande pour le moment.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-brand-black/5 last:border-0">
                      <td className="px-5 py-2.5 font-medium tabular-figures">{o.order_number}</td>
                      <td className="px-2 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                          {STATUS_LABEL[o.status]}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-figures font-medium">
                        {formatCurrency(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
