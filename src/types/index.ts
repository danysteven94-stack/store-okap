export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: "manual" | "cj_dropshipping" | "amazon" | "aliexpress" | "alibaba" | "other";
  created_at: string;
}

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  supplier_id: string | null;
  purchase_price: number;
  sale_price: number;
  compare_at_price: number | null;
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  product_id: string;
  quantity: number;
  min_stock: number;
  gadys_business_id: string | null;
  gadys_product_id: string | null;
  updated_at: string;
}

export interface Customer {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  addresses: { label: string; address: string; city: string; isDefault: boolean }[];
  created_at: string;
}

export type OrderStatus = "pending" | "preparing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  shipping_address: Record<string, unknown> | null;
  coupon_code: string | null;
  gadys_sale_id: string | null;
  synced_to_gadys: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  image?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export interface Payment {
  id: string;
  order_id: string;
  method: "cash" | "carte" | "moncash" | "natcash" | "zelle" | "virement";
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  pdf_url: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string | null;
  customer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}
