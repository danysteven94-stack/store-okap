"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Minus, Plus, Trash2, Tag } from "lucide-react";

export default function PanierPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const total = Math.max(0, subtotal - discount);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setChecking(true);
    setCouponMessage(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal })
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount(data.discount);
        setAppliedCode(data.code);
        setCouponMessage(`Code "${data.code}" appliqué : -${formatCurrency(data.discount)}`);
      } else {
        setDiscount(0);
        setAppliedCode(null);
        setCouponMessage(data.message ?? "Code invalide.");
      }
    } catch {
      setCouponMessage("Erreur réseau — réessayez.");
    } finally {
      setChecking(false);
    }
  }

  function goToCheckout() {
    if (appliedCode) sessionStorage.setItem("gadys-shop-coupon", JSON.stringify({ code: appliedCode, discount }));
    else sessionStorage.removeItem("gadys-shop-coupon");
    router.push("/checkout");
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-brand-black">Panier</h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p className="text-sm text-brand-black/50">Votre panier est vide.</p>
            <Link href="/produits" className="mt-3 inline-block text-sm text-brand-red hover:underline">
              Voir le catalogue →
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 rounded-xl bg-white p-4">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-brand-gray" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-black">{item.name}</p>
                    <p className="tabular-figures text-sm text-brand-black/50">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-black/15 hover:bg-brand-gray"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="tabular-figures w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-black/15 hover:bg-brand-gray"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="tabular-figures w-24 text-right text-sm font-bold">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="rounded-lg p-1.5 text-brand-black/40 hover:bg-brand-red/10 hover:text-brand-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-xl bg-white p-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-brand-black/50">
                  <Tag className="h-3.5 w-3.5" /> Code promo
                </label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="CODE2026"
                  />
                  <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={checking}>
                    OK
                  </Button>
                </div>
                {couponMessage && (
                  <p className={`text-xs ${appliedCode ? "text-emerald-600" : "text-brand-red"}`}>{couponMessage}</p>
                )}
              </div>

              <div className="mt-4 space-y-1.5 border-t border-brand-black/10 pt-4 text-sm">
                <div className="flex justify-between text-brand-black/60">
                  <span>Sous-total</span>
                  <span className="tabular-figures">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-brand-black/60">
                  <span>Remise</span>
                  <span className="tabular-figures">- {formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between font-display text-lg font-bold text-brand-black">
                  <span>Total</span>
                  <span className="tabular-figures">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button size="lg" className="mt-4 w-full" onClick={goToCheckout}>
                Passer la commande
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
