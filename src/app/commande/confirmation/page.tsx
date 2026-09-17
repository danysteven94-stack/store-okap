"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Download } from "lucide-react";

interface LastOrder {
  orderNumber: string;
  orderId: string;
  total: number;
  invoicePdfBase64: string;
}

export default function ConfirmationPage() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("gadys-shop-last-order");
    if (raw) {
      try {
        setOrder(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  function downloadInvoice() {
    if (!order) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${order.invoicePdfBase64}`;
    link.download = `facture-${order.orderNumber}.pdf`;
    link.click();
  }

  return (
    <div className="min-h-screen bg-brand-gray">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        {!order ? (
          <p className="text-sm text-brand-black/50">Aucune commande récente trouvée.</p>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h1 className="mt-4 font-display text-2xl font-bold text-brand-black">Commande confirmée !</h1>
            <p className="mt-2 text-sm text-brand-black/60">
              Commande <span className="font-medium tabular-figures">{order.orderNumber}</span> — total{" "}
              <span className="font-medium">{formatCurrency(order.total)}</span>
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={downloadInvoice}>
                <Download className="h-4 w-4" /> Télécharger la facture
              </Button>
              <Link href="/produits">
                <Button variant="outline">Continuer mes achats</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
