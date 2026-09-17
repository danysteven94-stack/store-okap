"use client";

import Link from "next/link";
import { ShoppingCart, User, Heart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="border-b border-brand-black/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red font-display text-sm font-bold text-white">
            GS
          </div>
          <span className="font-display text-lg font-bold text-brand-black">Gadys Shop</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-black/70 sm:flex">
          <Link href="/produits" className="hover:text-brand-black">
            Catalogue
          </Link>
          <Link href="/contact" className="hover:text-brand-black">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/compte/wishlist" className="rounded-lg p-2 text-brand-black/60 hover:bg-brand-gray">
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/compte/commandes" className="rounded-lg p-2 text-brand-black/60 hover:bg-brand-gray">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/panier" className="relative rounded-lg p-2 text-brand-black/60 hover:bg-brand-gray">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
