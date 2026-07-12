import { requireAdmin } from "@/lib/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileHeader } from "@/components/admin/admin-mobile-header";

export const metadata = {
  title: "Bloom Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminMobileHeader />
      <div className="lg:pl-60">
        <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
