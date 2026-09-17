import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SiteHeader } from "@/components/site-header";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/product-reviews";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

async function getProduct(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<Product>();
  return product;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produit introuvable — Gadys Shop" };

  return {
    title: `${product.name} — Gadys Shop`,
    description: product.description ?? `Achetez ${product.name} sur Gadys Shop.`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images?.[0] ? [product.images[0]] : undefined
    }
  };
}

export default async function ProduitDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const supabase = await createSupabaseServerClient();

  const { data: inventory } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("product_id", product.id)
    .maybeSingle();

  const quantity = inventory?.quantity ?? 0;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let initialSaved = false;
  if (user) {
    const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (customer) {
      const { data: wishlistRow } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("customer_id", customer.id)
        .eq("product_id", product.id)
        .maybeSingle();
      initialSaved = Boolean(wishlistRow);
    }
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-xl bg-white">
            <div className="absolute right-3 top-3 z-10">
              <WishlistButton productId={product.id} initialSaved={initialSaved} />
            </div>
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="aspect-square w-full bg-brand-gray" />
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-brand-black">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <p className="tabular-figures font-display text-2xl font-bold text-brand-red">
                {formatCurrency(product.sale_price)}
              </p>
              {product.compare_at_price && product.compare_at_price > product.sale_price && (
                <p className="tabular-figures text-sm text-brand-black/40 line-through">
                  {formatCurrency(product.compare_at_price)}
                </p>
              )}
            </div>

            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-brand-black/70">{product.description}</p>
            )}

            <div className="mt-6">
              <AddToCartButton
                productId={product.id}
                name={product.name}
                price={product.sale_price}
                image={product.images?.[0]}
                maxQuantity={quantity}
              />
            </div>

            {quantity > 0 && quantity <= 5 && (
              <p className="mt-3 text-xs text-amber-600">Plus que {quantity} en stock.</p>
            )}
          </div>
        </div>

        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
