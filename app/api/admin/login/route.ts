import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionCookieName,
  clearLoginAttempts,
  createAdminSession,
  createPasswordResetToken,
  ensureAdminUser,
  getLoginAttemptStatus,
  recordFailedAttempt,
  verifyAdminPassword,
} from "@/lib/admin/service";
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
  let payload: { email?: string; password?: string };

  try {
    payload = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required." },
      { status: 400 },
    );
  }

  const adminEmail = process.env.ADMIN_LOGIN_EMAIL;
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

  const normalizedEmail = normalizeEmail(email);
  const normalizedAdminEmail = normalizeEmail(adminEmail);

  if (normalizedEmail !== normalizedAdminEmail) {
    return NextResponse.json(
      { success: false, error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const { lockedUntil } = await getLoginAttemptStatus(normalizedEmail);
  if (lockedUntil && lockedUntil > new Date()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Too many attempts. Check the reset link that was emailed to you.",
      },
      { status: 429 },
    );
  }

  const isValid = await verifyAdminPassword(normalizedEmail, password);
  if (!isValid) {
    const attemptStatus = await recordFailedAttempt(normalizedEmail);

    if (attemptStatus.shouldSendReset) {
      try {
        const { token } = await createPasswordResetToken(normalizedEmail);
        const resetUrl = `${resolveOrigin(request)}/admin/reset?token=${token}`;
        await sendAdminResetEmail({
          to: normalizedAdminEmail,
          resetUrl,
          adminEmail: normalizedAdminEmail,
        });
      } catch (error) {
        console.error("Failed to send reset email", error);
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid credentials." },
      { status: 401 },
    );
  }

  await clearLoginAttempts(normalizedEmail);
  const session = await createAdminSession(normalizedEmail);

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: adminSessionCookieName,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: session.expiresAt,
    path: "/",
  });

  return response;
}
