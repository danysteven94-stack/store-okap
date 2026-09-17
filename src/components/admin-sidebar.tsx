"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, RefreshCw, LogOut, Package, DatabaseBackup } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/commandes", label: "Commandes", icon: ClipboardList, showBadge: true },
  { href: "/admin/sync", label: "Synchronisations", icon: RefreshCw },
  { href: "/admin/sauvegarde", label: "Sauvegarde", icon: DatabaseBackup }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/orders?status=pending")
      .then((r) => r.json())
      .then((d) => setNewOrdersCount(d.orders?.length ?? 0))
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/connexion");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-brand-black text-white">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red font-display text-sm font-bold">
          GS
        </div>
        <div>
          <p className="font-display text-base font-bold leading-none">Gadys Shop</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-white/35">Administration</p>
        </div>
      </div>

      <div className="mx-5 border-t border-white/[0.06]" />

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-white/[0.06] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-brand-red transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              {item.label}
              {item.showBadge && newOrdersCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold">
                  {newOrdersCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 border-t border-white/[0.06]" />

      <button
        onClick={handleLogout}
        className="mx-3 my-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/[0.04] hover:text-white"
      >
        <LogOut className="h-4 w-4" strokeWidth={2.25} />
        Déconnexion
      </button>
    </aside>
  );
}
