import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { getAdminProducts, getAdminSettings } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [products, settings] = await Promise.all([
    getAdminProducts(),
    getAdminSettings(),
  ]);

  return (
    <AdminDashboardClient
      initialProducts={products}
      initialSettings={settings}
    />
  );
}
