import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/requireSession";
import { verifyAdminPassword } from "@/lib/admin/service";

const verifySchema = z.object({
  currentPassword: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  let payload: { currentPassword?: string };

  try {
    payload = (await request.json()) as { currentPassword?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const parsed = verifySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Current password is required." },
      { status: 400 },
    );
  }

  const isValid = await verifyAdminPassword(
    session.email,
    parsed.data.currentPassword,
  );

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Current password is incorrect." },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
