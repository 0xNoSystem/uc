import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearLoginAttempts,
  consumePasswordResetToken,
  updateAdminPassword,
} from "@/lib/admin/service";

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  let payload: { token?: string; password?: string };

  try {
    payload = (await request.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const parsed = resetSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Token and password are required." },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;

  const email = await consumePasswordResetToken(token);
  if (!email) {
    return NextResponse.json(
      { success: false, error: "Reset link is invalid or expired." },
      { status: 400 },
    );
  }

  await updateAdminPassword(email, password);
  await clearLoginAttempts(email);

  return NextResponse.json({ success: true });
}
