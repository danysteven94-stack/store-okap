-- ============================================================
-- Gadys Shop — Migration 3 : wishlist, avis produits, sauvegardes
-- À exécuter APRÈS schema.sql et migration_2_product_photos.sql.
-- ============================================================

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, customer_id)
);
create index if not exists reviews_product_idx on reviews(product_id);

alter table wishlist_items enable row level security;
alter table reviews enable row level security;

-- Chaque client ne voit et ne gère que sa propre liste d'envies
drop policy if exists "Client gère sa propre wishlist" on wishlist_items;
create policy "Client gère sa propre wishlist"
  on wishlist_items for all
  using (customer_id in (select id from customers where auth_user_id = auth.uid()))
  with check (customer_id in (select id from customers where auth_user_id = auth.uid()));

-- Les avis approuvés sont publics en lecture ; un client connecté peut
-- créer un avis (limité à un par produit par la contrainte unique ci-dessus)
drop policy if exists "Avis approuvés visibles publiquement" on reviews;
create policy "Avis approuvés visibles publiquement"
  on reviews for select
  using (is_approved = true);

drop policy if exists "Client publie un avis" on reviews;
create policy "Client publie un avis"
  on reviews for insert
  with check (customer_id in (select id from customers where auth_user_id = auth.uid()));

-- Bucket privé pour les sauvegardes JSON automatiques (accès service_role
-- uniquement — aucune policy publique, donc invisible sans la clé serveur).
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;
