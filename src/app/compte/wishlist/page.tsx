import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { WishlistButton } from "@/components/wishlist-button";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

interface WishlistRow {
  id: string;
  product_id: string;
  products: Product;
}

export default async function WishlistPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();

  const { data: items } = customer
    ? await supabase
        .from("wishlist_items")
        .select("id, product_id, products(*)")
        .eq("customer_id", customer.id)
        .returns<WishlistRow[]>()
    : { data: [] as WishlistRow[] };

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-brand-black">Mes envies</h1>

        {!items || items.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p className="text-sm text-brand-black/50">Votre liste d&apos;envies est vide.</p>
            <Link href="/produits" className="mt-3 inline-block text-sm text-brand-red hover:underline">
              Voir le catalogue →
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="relative rounded-xl border border-brand-black/10 bg-white p-3">
                <div className="absolute right-4 top-4 z-10">
                  <WishlistButton productId={item.product_id} initialSaved />
                </div>
                <Link href={`/produits/${item.products.slug}`}>
                  {item.products.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.products.images[0]}
                      alt={item.products.name}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full rounded-lg bg-brand-gray" />
                  )}
                  <p className="mt-2 truncate text-sm font-medium text-brand-black">{item.products.name}</p>
                  <p className="tabular-figures text-sm font-bold text-brand-red">
                    {formatCurrency(item.products.sale_price)}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
