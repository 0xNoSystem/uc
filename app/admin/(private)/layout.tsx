import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/requireSession";

export default async function AdminPrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
