import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { generateOrderInvoicePdf } from "@/lib/invoice-pdf";
import { pushSaleToGadys } from "@/lib/gadys-connector";
import { sendOrderConfirmationEmail, sendAdminNewOrderEmail, sendLowStockAlertEmail } from "@/lib/email";
import { sendOrderConfirmationSms } from "@/lib/sms";
import { Order, OrderItem } from "@/types";

const bodySchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().positive() })).min(1),
  couponCode: z.string().optional(),
  customer: z.object({
    fullName: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1)
  }),
  paymentMethod: z.enum(["cash", "carte", "moncash", "natcash", "zelle", "virement"])
});

function generateOrderNumber() {
  return `GS-${Date.now().toString().slice(-9)}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  // 1. Revalider chaque article côté serveur (prix + stock réels — jamais
  // faire confiance aux valeurs envoyées par le navigateur).
  const productIds = parsed.data.items.map((i) => i.productId);
  const { data: products } = await supabase.from("products").select("*").in("id", productIds);
  const { data: inventories } = await supabase.from("inventory").select("*").in("product_id", productIds);

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const inventoryMap = new Map((inventories ?? []).map((i) => [i.product_id, i]));

  const orderItems: Omit<OrderItem, "id" | "order_id">[] = [];
  for (const line of parsed.data.items) {
    const product = productMap.get(line.productId);
    const inventory = inventoryMap.get(line.productId);
    if (!product || !product.is_active) {
      return NextResponse.json({ error: `Un produit du panier n'est plus disponible.` }, { status: 400 });
    }
    if (!inventory || inventory.quantity < line.quantity) {
      return NextResponse.json(
        { error: `Stock insuffisant pour "${product.name}" (disponible : ${inventory?.quantity ?? 0}).` },
        { status: 400 }
      );
    }
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.sale_price,
      quantity: line.quantity,
      subtotal: product.sale_price * line.quantity
    });
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

  // 2. Revalider le coupon côté serveur (jamais faire confiance au montant
  // de remise envoyé par le navigateur).
  let discount = 0;
  let couponRow: { id: string; used_count: number } | null = null;
  if (parsed.data.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", parsed.data.couponCode.toUpperCase().trim())
      .eq("is_active", true)
      .maybeSingle();

    if (coupon && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())) {
      if (coupon.max_uses === null || coupon.used_count < coupon.max_uses) {
        discount =
          coupon.discount_type === "percent"
            ? Math.round((subtotal * coupon.discount_value) / 100)
            : Math.min(coupon.discount_value, subtotal);
        couponRow = coupon;
      }
    }
  }

  const total = subtotal - discount;

  // 3. Client connecté ou invité ?
  const authClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  let customerId: string | null = null;
  if (user) {
    const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).maybeSingle();
    customerId = customer?.id ?? null;
  }

  // 4. Créer la commande + les articles
  const orderNumber = generateOrderNumber();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      status: "pending",
      subtotal,
      discount,
      total,
      shipping_address: parsed.data.customer,
      coupon_code: couponRow ? parsed.data.couponCode!.toUpperCase().trim() : null
    })
    .select()
    .single<Order>();

  if (orderError || !order) {
    return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
  }

  await supabase.from("order_items").insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
  await supabase.from("payments").insert({
    order_id: order.id,
    method: parsed.data.paymentMethod,
    amount: total,
    status: "pending"
  });
  await supabase.from("invoices").insert({ order_id: order.id, invoice_number: `INV-${orderNumber}` });

  if (couponRow) {
    await supabase.from("coupons").update({ used_count: couponRow.used_count + 1 }).eq("id", couponRow.id);
  }

  // 5. Déduire le stock local (Supabase), et alerter si le seuil est atteint
  for (const line of parsed.data.items) {
    const inventory = inventoryMap.get(line.productId)!;
    const newQuantity = inventory.quantity - line.quantity;
    await supabase
      .from("inventory")
      .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq("product_id", line.productId);

    if (newQuantity <= inventory.min_stock) {
      const product = productMap.get(line.productId);
      if (product) {
        sendLowStockAlertEmail(product.name, newQuantity, inventory.min_stock).catch(() => {});
      }
    }
  }

  // 6. Notifier Gadys Entreprise (best-effort : si ça échoue, la commande
  // reste valide côté site — on log l'erreur pour investigation manuelle).
  const byBusiness = new Map<string, { productId: string; quantity: number }[]>();
  for (const line of parsed.data.items) {
    const inventory = inventoryMap.get(line.productId)!;
    if (!inventory.gadys_business_id || !inventory.gadys_product_id) continue;
    const list = byBusiness.get(inventory.gadys_business_id) ?? [];
    list.push({ productId: inventory.gadys_product_id, quantity: line.quantity });
    byBusiness.set(inventory.gadys_business_id, list);
  }

  for (const [businessId, items] of byBusiness) {
    try {
      const result = await pushSaleToGadys({
        businessId,
        clientName: parsed.data.customer.fullName,
        clientPhone: parsed.data.customer.phone,
        items,
        paymentMethod: parsed.data.paymentMethod
      });
      await supabase
        .from("orders")
        .update({ gadys_sale_id: result.gadysSaleId, synced_to_gadys: true })
        .eq("id", order.id);
      await supabase.from("sync_logs").insert({ direction: "push", status: "success", details: { orderId: order.id, businessId } });
    } catch (err) {
      await supabase.from("sync_logs").insert({
        direction: "push",
        status: "error",
        details: { orderId: order.id, businessId, error: err instanceof Error ? err.message : String(err) }
      });
    }
  }

  // 7. Générer la facture PDF pour la confirmation immédiate
  const pdfBytes = await generateOrderInvoicePdf(
    order,
    orderItems.map((i) => ({ ...i, id: "", order_id: order.id })) as OrderItem[],
    parsed.data.customer.fullName
  );
  const fullOrderItems = orderItems.map((i) => ({ ...i, id: "", order_id: order.id })) as OrderItem[];

  // 8. Notifications — en parallèle, sans bloquer la réponse en cas d'échec
  // d'une seule d'entre elles (ex. Resend/Twilio mal configurés).
  await Promise.allSettled([
    parsed.data.customer.email
      ? sendOrderConfirmationEmail(order, fullOrderItems, parsed.data.customer.email, parsed.data.customer.fullName)
      : Promise.resolve(),
    sendOrderConfirmationSms(parsed.data.customer.phone, order.order_number, order.total),
    sendAdminNewOrderEmail(order, parsed.data.customer.fullName)
  ]);

  return NextResponse.json({
    orderNumber: order.order_number,
    orderId: order.id,
    total: order.total,
    invoicePdfBase64: Buffer.from(pdfBytes).toString("base64")
  });
}
