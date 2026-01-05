import { cookies } from "next/headers";
import { adminSessionCookieName, getAdminSession } from "@/lib/admin/service";

export const requireAdminSession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;
  if (!token) return null;
  return getAdminSession(token);
};
