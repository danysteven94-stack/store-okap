-- ============================================================
-- Gadys Shop — Schéma Supabase (Phase 1)
-- À exécuter dans Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- users (comptes admin du site, distincts des clients) ----------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade unique,
  email text not null unique,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- ---------- customers (acheteurs sur le site) ----------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null unique,
  email text not null unique,
  full_name text,
  phone text,
  addresses jsonb not null default '[]'::jsonb, -- [{label, address, city, isDefault}]
  created_at timestamptz not null default now()
);

-- ---------- categories ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- suppliers (fournisseurs / sources dropshipping) ----------
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- ex: "CJ Dropshipping", "Manuel"
  type text not null default 'manual' check (type in ('manual', 'cj_dropshipping', 'amazon', 'aliexpress', 'alibaba', 'other')),
  api_credentials jsonb,             -- clés API chiffrées côté application, jamais exposées au client
  created_at timestamptz not null default now()
);

-- ---------- products ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references categories(id) on delete set null,
  supplier_id uuid references suppliers(id) on delete set null,
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  compare_at_price numeric(12,2),    -- prix barré pour affichage promo
  images jsonb not null default '[]'::jsonb, -- ["https://...", ...]
  is_featured boolean not null default false,
  is_active boolean not null default true,
  external_id text,                  -- id du produit chez le fournisseur externe
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_supplier_idx on products(supplier_id);

-- ---------- inventory (stock — source unique partagée avec Gadys Entreprise) ----------
create table if not exists inventory (
  product_id uuid primary key references products(id) on delete cascade,
  quantity integer not null default 0,
  min_stock integer not null default 5,
  gadys_business_id text,            -- id de l'entreprise correspondante dans Gadys Entreprise
  gadys_product_id text,             -- id du produit correspondant dans Gadys Entreprise
  updated_at timestamptz not null default now()
);

-- ---------- orders ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'preparing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  shipping_address jsonb,
  coupon_code text,
  gadys_sale_id text,                -- id de la vente créée côté Gadys Entreprise (traçabilité)
  synced_to_gadys boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- order_items ----------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,        -- copie figée au moment de la vente
  unit_price numeric(12,2) not null,
  quantity integer not null,
  subtotal numeric(12,2) not null
);
create index if not exists order_items_order_idx on order_items(order_id);

-- ---------- invoices ----------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  invoice_number text not null unique,
  pdf_url text,
  created_at timestamptz not null default now()
);

-- ---------- payments ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method text not null check (method in ('cash', 'carte', 'moncash', 'natcash', 'zelle', 'virement')),
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

-- ---------- coupons (codes de réduction) ----------
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12,2) not null,
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- integrations (connexions API externes configurées) ----------
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete cascade,
  name text not null,                -- ex: "Gadys Entreprise Connector", "CJ Dropshipping Sync"
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- sync_logs (historique des synchronisations) ----------
create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references integrations(id) on delete cascade,
  direction text not null check (direction in ('import', 'export', 'push', 'pull')),
  status text not null check (status in ('success', 'error', 'partial')),
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security (RLS) — activée sur toutes les tables.
-- Le service_role (utilisé côté serveur uniquement, jamais dans le
-- navigateur) contourne RLS automatiquement pour les opérations admin.
-- ============================================================

alter table users enable row level security;
alter table customers enable row level security;
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table coupons enable row level security;
alter table integrations enable row level security;
alter table sync_logs enable row level security;

-- Catalogue public en lecture seule (produits actifs + catégories)
create policy "Produits actifs visibles publiquement" on products
  for select using (is_active = true);
create policy "Catégories visibles publiquement" on categories
  for select using (true);

-- Un client ne voit et ne modifie que ses propres données
create policy "Client voit son propre profil" on customers
  for select using (auth.uid() = auth_user_id);
create policy "Client modifie son propre profil" on customers
  for update using (auth.uid() = auth_user_id);
create policy "Client voit ses propres commandes" on orders
  for select using (
    customer_id in (select id from customers where auth_user_id = auth.uid())
  );
create policy "Client voit les articles de ses commandes" on order_items
  for select using (
    order_id in (
      select o.id from orders o
      join customers c on c.id = o.customer_id
      where c.auth_user_id = auth.uid()
    )
  );

-- Tout le reste (inventory, suppliers, integrations, sync_logs, invoices,
-- payments, users) n'a volontairement aucune policy publique : seul le
-- service_role (routes API serveur) peut y accéder.
