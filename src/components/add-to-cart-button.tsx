"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  maxQuantity: number;
}

export function AddToCartButton({ productId, name, price, image, maxQuantity }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ productId, name, unitPrice: price, image }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (maxQuantity <= 0) {
    return (
      <div className="rounded-xl bg-brand-red/10 px-4 py-3 text-sm font-medium text-brand-red">
        Rupture de stock
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-black/15 hover:bg-brand-gray"
        >
          <Minus className="h-4 w-4" />
        </button>
        <Input
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(e.target.value) || 1)))}
          className="w-16 text-center"
        />
        <button
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-black/15 hover:bg-brand-gray"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button type="button" size="lg" className="w-full" onClick={handleAdd}>
        <ShoppingCart className="h-4 w-4" />
        {added ? "Ajouté !" : "Ajouter au panier"}
      </Button>

      {added && (
        <button
          onClick={() => router.push("/panier")}
          className="w-full text-center text-sm text-brand-red hover:underline"
        >
          Voir le panier →
        </button>
      )}
    </div>
  );
}
