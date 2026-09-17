/**
 * Client du connecteur vers Gadys Entreprise. Toutes les fonctions ici sont
 * appelées uniquement côté serveur (routes API) — jamais depuis le
 * navigateur, car GADYS_CONNECTOR_API_KEY ne doit jamais être exposée.
 */

interface GadysProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  description?: string;
}

function baseUrl() {
  const url = process.env.GADYS_CONNECTOR_URL;
  if (!url) throw new Error("GADYS_CONNECTOR_URL n'est pas configurée.");
  return url.replace(/\/$/, "");
}

function apiKey() {
  const key = process.env.GADYS_CONNECTOR_API_KEY;
  if (!key) throw new Error("GADYS_CONNECTOR_API_KEY n'est pas configurée.");
  return key;
}

export async function fetchGadysProducts(businessId: string): Promise<GadysProduct[]> {
  const res = await fetch(`${baseUrl()}/api/connector/products?businessId=${businessId}`, {
    headers: { "x-api-key": apiKey() },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Gadys Entreprise a répondu ${res.status}`);
  const data = await res.json();
  return data.products as GadysProduct[];
}

export interface PushSaleInput {
  businessId: string;
  clientName: string;
  clientPhone?: string;
  items: { productId: string; quantity: number }[];
  discount?: number;
  paymentMethod?: "cash" | "carte" | "moncash" | "natcash" | "zelle" | "virement";
}

export interface PushSaleResult {
  gadysSaleId: string;
  invoiceNumber: string;
  total: number;
  invoicePdfBase64: string | null;
}

/** Notifie Gadys Entreprise qu'une vente vient d'être finalisée sur le site. */
export async function pushSaleToGadys(input: PushSaleInput): Promise<PushSaleResult> {
  const res = await fetch(`${baseUrl()}/api/connector/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey() },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : `Gadys Entreprise a répondu ${res.status}`);
  }
  return res.json();
}
