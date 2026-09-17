"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  initialSaved?: boolean;
  className?: string;
}

export function WishlistButton({ productId, initialSaved = false, className }: WishlistButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      if (saved) {
        const res = await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
        if (res.ok) setSaved(false);
      } else {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId })
        });
        if (res.status === 401) {
          router.push("/connexion");
          return;
        }
        if (res.ok) setSaved(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white",
        className
      )}
      aria-label={saved ? "Retirer de la liste d'envies" : "Ajouter à la liste d'envies"}
    >
      <Heart className={cn("h-4 w-4", saved ? "fill-brand-red text-brand-red" : "text-brand-black/50")} />
    </button>
  );
}
