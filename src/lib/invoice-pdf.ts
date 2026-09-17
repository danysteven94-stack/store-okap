import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Order, OrderItem } from "@/types";

const RED = rgb(0.784, 0.118, 0.173);
const BLACK = rgb(0.043, 0.043, 0.051);
const GRAY = rgb(0.45, 0.45, 0.47);
const LIGHT_GRAY = rgb(0.96, 0.96, 0.97);
const WHITE = rgb(1, 1, 1);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const ROW_HEIGHT = 22;

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " HTG";
}

export async function generateOrderInvoicePdf(
  order: Order,
  items: OrderItem[],
  customerName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Facture ${order.order_number}`);
  pdfDoc.setProducer("Gadys Shop");

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const tableWidth = PAGE_WIDTH - MARGIN * 2;

  // En-tête
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 90, width: PAGE_WIDTH, height: 90, color: BLACK });
  page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 63, width: 36, height: 36, color: RED });
  page.drawText("GS", { x: MARGIN + 6, y: PAGE_HEIGHT - 51, size: 14, font: fontBold, color: WHITE });
  page.drawText("Gadys Shop", { x: MARGIN + 56, y: PAGE_HEIGHT - 49, size: 16, font: fontBold, color: WHITE });
  page.drawText("FACTURE", {
    x: PAGE_WIDTH - MARGIN - fontBold.widthOfTextAtSize("FACTURE", 20),
    y: PAGE_HEIGHT - 49,
    size: 20,
    font: fontBold,
    color: RED
  });

  let y = PAGE_HEIGHT - 90 - 36;

  page.drawText("FACTURÉ À", { x: MARGIN, y, size: 9, font: fontBold, color: GRAY });
  page.drawText(customerName || "Client", { x: MARGIN, y: y - 16, size: 11, font: fontBold, color: BLACK });

  const rightX = MARGIN + (tableWidth - 24) / 2 + 24;
  const infoRows: [string, string][] = [
    ["N° Commande", order.order_number],
    ["Date", new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(order.created_at))],
    ["Statut", order.status]
  ];
  infoRows.forEach(([label, value], i) => {
    const rowY = y - i * 14;
    page.drawText(label, { x: rightX, y: rowY, size: 9, font: fontRegular, color: GRAY });
    const valueWidth = fontBold.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: PAGE_WIDTH - MARGIN - valueWidth, y: rowY, size: 10, font: fontBold, color: BLACK });
  });

  y -= 60;

  // Tableau des articles
  page.drawRectangle({ x: MARGIN, y: y - ROW_HEIGHT + 6, width: tableWidth, height: ROW_HEIGHT, color: BLACK });
  page.drawText("Produit", { x: MARGIN + 8, y: y - 10, size: 9, font: fontBold, color: WHITE });
  page.drawText("Qté", { x: MARGIN + tableWidth * 0.55, y: y - 10, size: 9, font: fontBold, color: WHITE });
  page.drawText("Prix", { x: MARGIN + tableWidth * 0.7, y: y - 10, size: 9, font: fontBold, color: WHITE });
  page.drawText("Total", { x: MARGIN + tableWidth * 0.86, y: y - 10, size: 9, font: fontBold, color: WHITE });
  y -= ROW_HEIGHT;

  items.forEach((item, i) => {
    if (i % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: y - ROW_HEIGHT + 8, width: tableWidth, height: ROW_HEIGHT, color: LIGHT_GRAY });
    }
    page.drawText(item.product_name, { x: MARGIN + 8, y: y - 10, size: 9.5, font: fontRegular, color: BLACK });
    page.drawText(String(item.quantity), { x: MARGIN + tableWidth * 0.55, y: y - 10, size: 9.5, font: fontRegular, color: BLACK });
    page.drawText(formatMoney(item.unit_price), { x: MARGIN + tableWidth * 0.7, y: y - 10, size: 9.5, font: fontRegular, color: BLACK });
    page.drawText(formatMoney(item.subtotal), { x: MARGIN + tableWidth * 0.86, y: y - 10, size: 9.5, font: fontBold, color: BLACK });
    y -= ROW_HEIGHT;
  });

  y -= 16;

  const totalLines: [string, string, boolean][] = [
    ["Sous-total", formatMoney(order.subtotal), false],
    ["Remise", `- ${formatMoney(order.discount)}`, false],
    ["TOTAL", formatMoney(order.total), true]
  ];
  const totalsX = MARGIN + tableWidth * 0.6;
  totalLines.forEach(([label, value, emphasis], i) => {
    const rowY = y - i * 18;
    if (emphasis) {
      page.drawRectangle({ x: totalsX - 10, y: rowY - 14, width: PAGE_WIDTH - MARGIN - (totalsX - 10), height: 22, color: RED });
    }
    page.drawText(label, { x: totalsX, y: rowY, size: emphasis ? 11 : 9.5, font: fontBold, color: emphasis ? WHITE : GRAY });
    const valueWidth = fontBold.widthOfTextAtSize(value, emphasis ? 12 : 10);
    page.drawText(value, {
      x: PAGE_WIDTH - MARGIN - valueWidth - 8,
      y: rowY,
      size: emphasis ? 12 : 10,
      font: fontBold,
      color: emphasis ? WHITE : BLACK
    });
  });

  page.drawText("Merci pour votre confiance.", { x: MARGIN, y: 50, size: 9, font: fontRegular, color: GRAY });

  return pdfDoc.save();
}
