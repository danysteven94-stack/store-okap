-- ============================================================
-- Gadys Shop — Migration 2 : stockage des photos produits
-- À exécuter APRÈS supabase/schema.sql (une seule fois).
-- ============================================================

-- Bucket public pour les photos produits (upload par les admins uniquement,
-- lecture publique pour que le catalogue s'affiche sur le site).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Images produits visibles publiquement" on storage.objects;
create policy "Images produits visibles publiquement"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Seuls les admins uploadent des images produits" on storage.objects;
create policy "Seuls les admins uploadent des images produits"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from users where auth_user_id = auth.uid())
  );

drop policy if exists "Seuls les admins suppriment des images produits" on storage.objects;
create policy "Seuls les admins suppriment des images produits"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from users where auth_user_id = auth.uid())
  );

-- Les admins peuvent gérer le catalogue complet (produits, catégories,
-- inventaire) — la table `products` n'avait qu'une policy de lecture
-- publique jusqu'ici (Phase 1), il faut l'écriture pour le dashboard.
drop policy if exists "Admins gèrent les produits" on products;
create policy "Admins gèrent les produits"
  on products for all
  using (exists (select 1 from users where auth_user_id = auth.uid()))
  with check (exists (select 1 from users where auth_user_id = auth.uid()));

drop policy if exists "Admins gèrent les catégories" on categories;
create policy "Admins gèrent les catégories"
  on categories for all
  using (exists (select 1 from users where auth_user_id = auth.uid()))
  with check (exists (select 1 from users where auth_user_id = auth.uid()));

drop policy if exists "Admins gèrent l'inventaire" on inventory;
create policy "Admins gèrent l'inventaire"
  on inventory for all
  using (exists (select 1 from users where auth_user_id = auth.uid()))
  with check (exists (select 1 from users where auth_user_id = auth.uid()));
