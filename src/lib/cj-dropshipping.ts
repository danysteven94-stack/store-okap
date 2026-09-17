/**
 * Client pour l'API publique CJ Dropshipping (developers.cjdropshipping.com).
 *
 * IMPORTANT : ceci nécessite un compte CJ Dropshipping avec un accès API
 * activé (email + clé API générés depuis le tableau de bord CJ). Sans ces
 * identifiants dans CJ_EMAIL / CJ_API_KEY, ce module ne peut rien importer.
 * Les noms de champs suivent la documentation publique de CJ au moment de
 * l'écriture — à revérifier sur developers.cjdropshipping.com si CJ a changé
 * son contrat d'API depuis.
 */

const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

interface CjTokenResponse {
  data?: { accessToken: string; accessTokenExpiryDate: string };
  result: boolean;
  message: string;
}

async function getAccessToken(): Promise<string> {
  const email = process.env.CJ_EMAIL;
  const apiKey = process.env.CJ_API_KEY;
  if (!email || !apiKey) {
    throw new Error("CJ_EMAIL et CJ_API_KEY doivent être configurés pour synchroniser avec CJ Dropshipping.");
  }

  const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: apiKey })
  });

  const data: CjTokenResponse = await res.json();
  if (!res.ok || !data.result || !data.data) {
    throw new Error(`Échec d'authentification CJ Dropshipping : ${data.message ?? res.status}`);
  }
  return data.data.accessToken;
}

export interface CjProduct {
  pid: string;
  productName: string;
  productImage: string;
  sellPrice: string;
  productSku: string;
}

/** Recherche des produits dans le catalogue CJ Dropshipping (par mot-clé). */
export async function searchCjProducts(keyword: string, pageSize = 20): Promise<CjProduct[]> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${CJ_BASE_URL}/product/list?productNameEn=${encodeURIComponent(keyword)}&pageSize=${pageSize}`,
    { headers: { "CJ-Access-Token": accessToken } }
  );

  const data = await res.json();
  if (!res.ok || !data.result) {
    throw new Error(`Échec de recherche CJ Dropshipping : ${data.message ?? res.status}`);
  }
  return (data.data?.list ?? []) as CjProduct[];
}
