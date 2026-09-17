# Gadys Shop — Boutique en ligne connectée à Gadys Entreprise

**Phase 1 : fondations.** Projet Next.js 15 + Supabase séparé de Gadys
Entreprise (multibiz-app), relié à lui par un connecteur API.

## ⚠️ À savoir avant de continuer

Certaines intégrations demandées dans le cahier des charges initial ne sont
**pas réalisables** techniquement, quelle que soit la qualité du code :

- **Temu et Shein** n'ont aucune API publique permettant d'importer des
  produits — aucune solution ne le permet légalement.
- **Amazon** (Selling Partner API) exige d'avoir déjà un compte vendeur
  Amazon approuvé — ce n'est pas une simple clé à obtenir.
- **AliExpress / Alibaba** proposent une API d'affiliation (pour toucher une
  commission sur des liens), pas une API pour importer un catalogue à
  revendre soi-même.
- **CJ Dropshipping** est la seule intégration de la liste qui dispose d'une
  vraie API publique pour vendeurs — c'est celle qui est implémentée ici
  (`src/lib/cj-dropshipping.ts`). Elle nécessite un compte CJ Dropshipping
  avec accès API (email + clé API depuis leur tableau de bord).

Le système est conçu pour qu'ajouter un futur fournisseur (import CSV manuel,
ou une intégration s'ils ouvrent une API un jour) se fasse sans tout
reconstruire : chaque produit a un `supplier_id` et un `external_id`.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (base de
données + authentification clients) · Vercel.

## 1. Créer le projet Supabase

1. Sur [supabase.com](https://supabase.com), créez un nouveau projet.
2. Dans **SQL Editor**, collez et exécutez tout le contenu de
   `supabase/schema.sql` — cela crée les 12 tables et active la sécurité RLS.
3. Dans **Project Settings > API**, copiez `Project URL`, `anon public key`,
   et `service_role key`.

## 2. Installation locale

```bash
npm install
cp .env.example .env.local
```

Renseignez dans `.env.local` les clés Supabase, et — si vous voulez tester
le connecteur — l'URL de votre app Gadys Entreprise déployée et la clé
`CONNECTOR_API_KEY` (générée côté Gadys Entreprise, voir plus bas).

```bash
npm run dev
```

## 3. Activer le connecteur côté Gadys Entreprise

Le connecteur est déjà ajouté au projet **multibiz-app** (Gadys Entreprise) :

- `GET /api/connector/products?businessId=xxx` — expose le catalogue et le
  stock actuel d'une entreprise.
- `POST /api/connector/sales` — reçoit une commande du site et crée une
  vraie vente dans Gadys Entreprise (déduit le stock, génère une facture,
  compte dans les revenus/rapports — en réutilisant `createSale()` telle
  quelle, donc aucune logique dupliquée).

Ces deux routes sont protégées par un en-tête `x-api-key`, **pas** par la
session admin habituelle (puisque les appels viennent d'un serveur, pas d'un
navigateur connecté). Pour les activer :

1. Dans les variables d'environnement du projet Vercel **multibiz-app**,
   ajoutez `CONNECTOR_API_KEY` (générez une valeur avec
   `openssl rand -base64 32`).
2. Mettez la **même valeur** dans `GADYS_CONNECTOR_API_KEY` sur le projet
   **gadys-shop**, et `GADYS_CONNECTOR_URL` = l'URL de production de
   multibiz-app.
3. Redéployez les deux projets.

Testez avec la page `/admin/sync` (temporaire, voir limitations plus bas).

## 4. Importer des produits CJ Dropshipping (optionnel)

Renseignez `CJ_EMAIL` et `CJ_API_KEY` (obtenus depuis votre compte CJ
Dropshipping), puis utilisez `/admin/sync` pour chercher et importer des
produits par mot-clé. Chaque import applique une marge de 50 % par défaut
sur le prix CJ pour définir le prix de vente — ajustable dans le code
(`markupPercent`).

## État d'avancement

- [x] **Phase 1** — Projet Next.js + Supabase, schéma complet (12 tables),
      authentification clients (Supabase Auth), page d'accueil et catalogue
      publics (lecture depuis Supabase), connecteur API bidirectionnel
      fonctionnel avec Gadys Entreprise, import CJ Dropshipping fonctionnel.
- [x] **Phase 2** — Panier persistant (localStorage), page produit avec
      ajout au panier, codes promo (table `coupons`, validation serveur),
      checkout complet (revalidation des prix/stock côté serveur, jamais
      confiance au navigateur), création de commande + articles + paiement +
      facture, déduction du stock Supabase, synchronisation automatique vers
      Gadys Entreprise pour les produits qui en proviennent, page de
      confirmation avec téléchargement de facture, suivi des commandes pour
      les clients connectés (`/compte/commandes`).
- [x] **Phase 3** — Dashboard admin : authentification admin séparée des
      comptes clients (table `users`), statistiques (ventes totales, revenus
      du mois, clients, produits actifs, produits les plus vendus, dernières
      commandes), gestion des commandes (filtrage par statut, changement de
      statut, impression de facture PDF).
- [x] **Phase 4** — Notifications : email de confirmation au client (Resend),
      SMS de confirmation (Twilio), email à l'admin à chaque nouvelle
      commande + badge de compteur dans le dashboard, alerte email quand le
      stock d'un produit atteint son seuil minimum (déclenchée au checkout
      et lors des synchronisations Gadys Entreprise).
- [x] **Phase 5 (partielle)** — Gestion complète des produits depuis le
      dashboard : créer/modifier/supprimer un produit, upload de plusieurs
      photos (Supabase Storage), catégories et sous-catégories, SKU, prix
      d'achat/vente/barré, stock et seuil d'alerte modifiables directement.
- [x] **Phase 6** — Wishlist (liste d'envies persistante par client, page
      `/compte/wishlist`), avis produits (note 1-5 + commentaire, un avis par
      client par produit, moyenne affichée), SEO (métadonnées par produit,
      `sitemap.xml`, `robots.txt`, Open Graph), PWA (manifest, icônes
      générées, service worker basique pour un fonctionnement hors-ligne
      minimal), sauvegarde automatique quotidienne (Vercel Cron) + manuelle
      vers Supabase Storage, avec page admin dédiée.

**Toutes les fonctionnalités du cahier des charges initial sont couvertes**,
avec les limites honnêtes documentées ci-dessous (paiement non traité par un
vrai processeur, notifications "best-effort", intégrations fournisseurs
limitées par ce que leurs API permettent réellement).

## Activer l'upload de photos produits

Exécutez `supabase/migration_2_product_photos.sql` dans le SQL Editor de
Supabase (une seule fois) — cela crée le bucket de stockage `product-images`
et les règles de sécurité (upload réservé aux admins, lecture publique pour
que les photos s'affichent sur le site). Sans cette migration, le bouton
d'upload dans `/admin/produits` échouera.

## Activer wishlist, avis produits et sauvegarde automatique

Exécutez ensuite `supabase/migration_3_wishlist_reviews_backup.sql` (une
seule fois) — crée les tables `wishlist_items` et `reviews`, ainsi que le
bucket privé `backups`.

Pour la sauvegarde automatique quotidienne, ajoutez `CRON_SECRET` dans les
variables d'environnement Vercel (générez une valeur avec
`openssl rand -base64 32`) — `vercel.json` déclare déjà la tâche cron
quotidienne à 3h du matin.

## Créer le premier compte administrateur

Il n'y a volontairement **aucune page d'inscription admin publique** — un
compte admin doit être créé manuellement :

1. Dans Supabase, allez dans **Authentication > Users > Add user**, créez
   l'utilisateur avec un email et un mot de passe.
2. Copiez son `User UID`.
3. Dans **SQL Editor**, exécutez :
   ```sql
   insert into users (auth_user_id, email, full_name, role)
   values ('<UID copié>', 'admin@example.com', 'Administrateur', 'admin');
   ```
4. Connectez-vous sur `/admin/connexion` avec cet email/mot de passe.

## ⚠️ Limitations connues de cette Phase 1 + 3 (à corriger avant mise en production)

- **Le panier et le paiement n'existent pas encore** — la Phase 3 ajoute le
  dashboard admin, mais le tunnel d'achat complet côté client reste la
  Phase 2.
- **Aucun email de confirmation n'est envoyé** — la facture est téléchargeable
  immédiatement après la commande (page de confirmation), mais rien n'est
  envoyé automatiquement par email ou SMS pour le moment (Phase 4).
- **Le paiement n'est pas réellement traité** — le mode de paiement choisi
  est enregistré (`payments.status = 'pending'`), mais aucune intégration
  avec un vrai processeur de paiement (carte, MonCash, etc.) n'existe
  encore. Pour l'instant, considérez ceci comme une prise de commande avec
  paiement à confirmer manuellement (ex. à la livraison, ou par virement).
- **Nouvelle table `coupons`** ajoutée au schéma — si votre base Supabase
  date de la Phase 1, ré-exécutez `supabase/schema.sql` en entier : toutes
  les instructions utilisent `if not exists`, donc c'est sans risque pour
  vos données existantes.
- **Les notifications (Phase 4) sont "best-effort"** — si Resend ou Twilio
  ne sont pas configurés, ou si l'envoi échoue, la commande reste valide
  quand même. Vérifiez les logs Vercel si un client signale ne rien avoir
  reçu.
- **Le stock CJ Dropshipping** est initialisé à une valeur arbitraire (999)
  puisqu'en dropshipping il n'y a pas de stock physique local à suivre —
  seul le fournisseur gère la disponibilité réelle.

## Architecture du stock centralisé

Gadys Entreprise (Upstash Redis) reste la **source de vérité** pour le stock
des produits physiques gérés en boutique. Gadys Shop **reflète** cet état
dans sa table `inventory` Supabase via la synchronisation
`/api/sync/gadys-products` (à automatiser par un cron en Phase 2). Quand une
vente se fait sur le site, `pushSaleToGadys()` notifie Gadys Entreprise, qui
déduit le vrai stock — la prochaine synchronisation ramène l'état à jour des
deux côtés.
