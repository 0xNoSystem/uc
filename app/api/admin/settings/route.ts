import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/requireSession";

const settingsSchema = z.object({
  shippingFee: z.coerce.number().nonnegative(),
  shippingFreeThreshold: z.coerce.number().nonnegative(),
  supportEmail: z.string().min(1),
  supportPhone: z.string().min(1),
});

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid settings data." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const { rows } = await sql`
    INSERT INTO store_settings (
      id,
      shipping_fee,
      shipping_free_threshold,
      support_email,
      support_phone,
      updated_at
    )
    VALUES (
      1,
      ${data.shippingFee},
      ${data.shippingFreeThreshold},
      ${data.supportEmail},
      ${data.supportPhone},
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      shipping_fee = ${data.shippingFee},
      shipping_free_threshold = ${data.shippingFreeThreshold},
      support_email = ${data.supportEmail},
      support_phone = ${data.supportPhone},
      updated_at = NOW()
    RETURNING
      shipping_fee,
      shipping_free_threshold,
      support_email,
      support_phone
  `;

  const row = rows[0];
  return NextResponse.json({
    success: true,
    settings: {
      shippingFee: Number(row.shipping_fee),
      shippingFreeThreshold: Number(row.shipping_free_threshold),
      supportEmail: String(row.support_email),
      supportPhone: String(row.support_phone),
    },
  });
}
