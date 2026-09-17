import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

export default async function ProduitsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("products").select("*").eq("is_active", true);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data: products } = await query.order("created_at", { ascending: false }).returns<Product[]>();

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-brand-black">Catalogue</h1>

        <form className="mt-4 max-w-sm">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un produit..."
            className="h-10 w-full rounded-xl border border-brand-black/15 bg-white px-3 text-sm"
          />
        </form>

        {!products || products.length === 0 ? (
          <p className="mt-8 text-sm text-brand-black/50">Aucun produit trouvé.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/produits/${p.slug}`}
                className="rounded-xl border border-brand-black/10 bg-white p-3 transition hover:shadow-md"
              >
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <div className="aspect-square w-full rounded-lg bg-brand-gray" />
                )}
                <p className="mt-2 truncate text-sm font-medium text-brand-black">{p.name}</p>
                <p className="tabular-figures text-sm font-bold text-brand-red">{formatCurrency(p.sale_price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
