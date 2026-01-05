import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookieName,
  deleteAdminSession,
} from "@/lib/admin/service";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(adminSessionCookieName)?.value;

  if (token) {
    await deleteAdminSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
