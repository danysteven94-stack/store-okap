import { requireAdmin } from "@/lib/require-admin";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end border-b border-brand-black/[0.06] bg-white/80 px-6 py-3.5 backdrop-blur">
          <p className="text-sm text-brand-black/60">{admin.fullName || admin.email}</p>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
