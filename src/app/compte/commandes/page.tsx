import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/types";

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

export default async function MesCommandesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // La policy RLS "Client voit ses propres commandes" garantit qu'on ne
  // récupère que les commandes de ce client, même avec une requête simple.
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-brand-black">Mes commandes</h1>

        {!orders || orders.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p className="text-sm text-brand-black/50">Vous n&apos;avez pas encore de commande.</p>
            <Link href="/produits" className="mt-3 inline-block text-sm text-brand-red hover:underline">
              Voir le catalogue →
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl bg-white p-4">
                <div>
                  <p className="font-medium tabular-figures text-brand-black">{o.order_number}</p>
                  <p className="text-xs text-brand-black/40">
                    {new Date(o.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </span>
                <p className="tabular-figures font-bold text-brand-black">{formatCurrency(o.total)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
