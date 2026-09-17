import { Resend } from "resend";
import { Order, OrderItem } from "@/types";

/**
 * Nécessite un compte Resend (resend.com, plan gratuit disponible) et
 * RESEND_API_KEY dans les variables d'environnement. Sans clé configurée,
 * chaque fonction ici log un avertissement et ne fait rien — aucune
 * fonctionnalité n'est bloquée, seules les notifications sont désactivées.
 */

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY non configurée — notification email ignorée.");
    return null;
  }
  return new Resend(key);
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "Gadys Shop <commandes@resend.dev>";

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " HTG";
}

function itemsHtml(items: OrderItem[]) {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${i.product_name} × ${i.quantity}</td><td style="text-align:right;">${formatMoney(i.subtotal)}</td></tr>`
    )
    .join("");
}

export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[],
  customerEmail: string,
  customerName: string
) {
  const client = getClient();
  if (!client || !customerEmail) return;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: customerEmail,
    subject: `Confirmation de commande ${order.order_number}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background:#0B0B0D; padding:20px; text-align:center;">
          <span style="color:#fff; font-size:18px; font-weight:bold;">Gadys Shop</span>
        </div>
        <div style="padding:20px;">
          <p>Bonjour ${customerName},</p>
          <p>Votre commande <strong>${order.order_number}</strong> a bien été reçue.</p>
          <table style="width:100%; border-collapse:collapse; margin:16px 0;">
            ${itemsHtml(items)}
            <tr><td style="padding-top:10px; font-weight:bold;">Total</td><td style="text-align:right; padding-top:10px; font-weight:bold; color:#C81E2C;">${formatMoney(order.total)}</td></tr>
          </table>
          <p>Nous vous recontacterons pour la livraison. Merci pour votre confiance !</p>
        </div>
      </div>
    `
  });
}

export async function sendAdminNewOrderEmail(order: Order, customerName: string) {
  const client = getClient();
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!client || !adminEmail) return;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: adminEmail,
    subject: `Nouvelle commande ${order.order_number} — ${formatMoney(order.total)}`,
    html: `
      <p>Nouvelle commande reçue :</p>
      <ul>
        <li>N° : ${order.order_number}</li>
        <li>Client : ${customerName}</li>
        <li>Total : ${formatMoney(order.total)}</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/commandes">Voir dans le dashboard</a></p>
    `
  });
}

export async function sendLowStockAlertEmail(productName: string, quantity: number, minStock: number) {
  const client = getClient();
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!client || !adminEmail) return;

  await client.emails.send({
    from: FROM_ADDRESS,
    to: adminEmail,
    subject: `⚠️ Stock faible : ${productName}`,
    html: `<p><strong>${productName}</strong> n'a plus que <strong>${quantity}</strong> en stock (seuil : ${minStock}). Pensez à réapprovisionner.</p>`
  });
}
