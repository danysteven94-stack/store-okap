import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { generateOrderInvoicePdf } from "@/lib/invoice-pdf";
import { Order, OrderItem } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*, customers(full_name)").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id).returns<OrderItem[]>()
  ]);

  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  const customerName = (order as unknown as { customers?: { full_name?: string } }).customers?.full_name ?? "Client";
  const pdfBytes = await generateOrderInvoicePdf(order as Order, items ?? [], customerName);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${(order as Order).order_number}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
