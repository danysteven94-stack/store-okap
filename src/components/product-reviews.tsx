"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Review } from "@/types";

function StarRow({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-brand-black/20"}`} />
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setAverage(d.average ?? 0);
        setCount(d.count ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erreur.");
        return;
      }
      setShowForm(false);
      setComment("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 border-t border-brand-black/10 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-brand-black">Avis clients</h2>
          {count > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <StarRow value={average} />
              <span className="text-sm text-brand-black/50">
                {average.toFixed(1)} ({count} avis)
              </span>
            </div>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          Laisser un avis
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl bg-white p-4">
          <div>
            <p className="mb-1 text-xs font-medium text-brand-black/50">Note</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)}>
                  <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-brand-black/20"}`} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Votre commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {error && <p className="text-sm text-brand-red">{error}</p>}
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Envoi..." : "Publier l'avis"}
          </Button>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-brand-black/50">Chargement...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-brand-black/50">Aucun avis pour le moment — soyez le premier !</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-brand-black">{r.customer_name}</p>
                <StarRow value={r.rating} size="h-3.5 w-3.5" />
              </div>
              {r.comment && <p className="mt-2 text-sm text-brand-black/70">{r.comment}</p>}
              <p className="mt-2 text-xs text-brand-black/30">
                {new Date(r.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
