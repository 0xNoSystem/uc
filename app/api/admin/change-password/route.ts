import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/requireSession";
import { updateAdminPassword, verifyAdminPassword } from "@/lib/admin/service";

const changeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  let payload: { currentPassword?: string; newPassword?: string };

  try {
    payload = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const parsed = changeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Current and new password are required." },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { success: false, error: "New password must be different." },
      { status: 400 },
    );
  }

  const isValid = await verifyAdminPassword(session.email, currentPassword);
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Current password is incorrect." },
      { status: 401 },
    );
  }

  await updateAdminPassword(session.email, newPassword);

  return NextResponse.json({ success: true });
}
