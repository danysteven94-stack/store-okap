"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash à la livraison" },
  { value: "carte", label: "Carte" },
  { value: "moncash", label: "MonCash" },
  { value: "natcash", label: "NatCash" },
  { value: "zelle", label: "Zelle" },
  { value: "virement", label: "Virement" }
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gadys-shop-coupon");
    if (raw) {
      try {
        setCoupon(JSON.parse(raw));
      } catch {
        // ignore une valeur corrompue
      }
    }
  }, []);

  useEffect(() => {
    if (items.length === 0) router.push("/panier");
  }, [items, router]);

  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: coupon?.code,
          customer: { fullName, email, phone, address, city },
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Impossible de finaliser la commande.");
        return;
      }

      sessionStorage.setItem("gadys-shop-last-order", JSON.stringify(data));
      sessionStorage.removeItem("gadys-shop-coupon");
      clearCart();
      router.push("/commande/confirmation");
    } catch {
      setError("Pas de connexion au serveur. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-brand-black">Finaliser la commande</h1>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-xl bg-white p-5 lg:col-span-2">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email (pour la confirmation)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optionnel" />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="509..." />
            </div>
            <div className="space-y-1.5">
              <Label>Adresse de livraison</Label>
              <Input required value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ville</Label>
              <Input required value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}
          </div>

          <div className="h-fit space-y-3 rounded-xl bg-white p-5">
            <p className="font-display font-bold text-brand-black">Résumé</p>
            {items.map((i) => (
              <div key={i.productId} className="flex justify-between text-sm text-brand-black/60">
                <span className="truncate pr-2">
                  {i.name} × {i.quantity}
                </span>
                <span className="tabular-figures shrink-0">{formatCurrency(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
            <div className="space-y-1 border-t border-brand-black/10 pt-3 text-sm">
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
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Confirmation..." : "Confirmer la commande"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
