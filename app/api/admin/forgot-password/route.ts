import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, ensureAdminUser } from "@/lib/admin/service";
import { sendAdminResetEmail } from "@/lib/email/sendAdminResetEmail";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const resolveOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export async function POST(request: NextRequest) {
  let payload: { email?: string };

  try {
    payload = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  const adminEmail = process.env.ADMIN_LOGIN_EMAIL;
  const normalizedAdminEmail = adminEmail ? normalizeEmail(adminEmail) : "";

  if (!adminEmail) {
    return NextResponse.json(
      { success: false, error: "Admin login is not configured." },
      { status: 500 },
    );
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: "Admin login is not configured." },
      { status: 500 },
    );
  }

  await ensureAdminUser();

  if (normalizeEmail(email) !== normalizedAdminEmail) {
    return NextResponse.json({ success: true });
  }

  try {
    const { token } = await createPasswordResetToken(normalizedAdminEmail);
    const resetUrl = `${resolveOrigin(request)}/admin/reset?token=${token}`;
    const recipient = process.env.ADMIN_EMAIL ?? normalizedAdminEmail;
    await sendAdminResetEmail({
      to: recipient,
      resetUrl,
      adminEmail: normalizedAdminEmail,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send reset email", error);
    return NextResponse.json(
      { success: false, error: "Unable to send reset email." },
      { status: 500 },
    );
  }
}
