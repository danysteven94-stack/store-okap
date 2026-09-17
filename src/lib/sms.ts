import twilio from "twilio";

/**
 * Nécessite un compte Twilio (twilio.com) avec TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN, et TWILIO_PHONE_NUMBER configurés. Les SMS
 * internationaux vers Haïti sont payants et facturés par Twilio, pas par
 * cette application. Sans configuration, la fonction log un avertissement
 * et ne fait rien — le reste du site continue de fonctionner normalement.
 */

function normalizeHaitiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `+509${digits}`;
  if (digits.startsWith("509")) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export async function sendOrderConfirmationSms(phone: string, orderNumber: string, total: number) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !authToken || !fromNumber) {
    console.warn("[sms] Identifiants Twilio non configurés — SMS de confirmation ignoré.");
    return;
  }

  const client = twilio(sid, authToken);
  const totalFormatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(total);

  try {
    await client.messages.create({
      from: fromNumber,
      to: normalizeHaitiPhone(phone),
      body: `Gadys Shop : commande ${orderNumber} confirmée, total ${totalFormatted} HTG. Merci pour votre achat !`
    });
  } catch (err) {
    console.error("[sms] Échec d'envoi :", err instanceof Error ? err.message : err);
  }
}
