import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: featured } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(8)
    .returns<Product[]>();

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />

      <section className="bg-brand-black py-16 text-center text-white">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Gadys Shop</h1>
        <p className="mx-auto mt-3 max-w-md text-white/60">
          La boutique en ligne de Gadys Entreprise — mêmes produits, même stock, livrés chez vous.
        </p>
        <Link
          href="/produits"
          className="mt-6 inline-block rounded-xl bg-brand-red px-6 py-3 text-sm font-medium text-white hover:bg-brand-red-dark"
        >
          Voir le catalogue
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-xl font-bold text-brand-black">Produits en vedette</h2>
        {!featured || featured.length === 0 ? (
          <p className="mt-4 text-sm text-brand-black/50">
            Aucun produit en vedette pour le moment. Synchronisez ou importez votre catalogue pour
            commencer.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
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
      </section>
    </div>
  );
}
