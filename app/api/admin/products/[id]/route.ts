import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/requireSession";

const productSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  newPrice: z.coerce.number().positive().optional().nullable(),
  primaryImage: z.string().min(1),
  secondaryImage: z.string().min(1),
  badge: z.string().optional().nullable(),
  colors: z.array(z.string()).optional().nullable(),
});

const normalizeColors = (colors?: string[] | null) =>
  Array.isArray(colors)
    ? colors.map((color) => color.trim()).filter(Boolean)
    : [];

const parseColors = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
};

type ProductRow = {
  id: string;
  name: string;
  price: number | string;
  new_price: number | string | null;
  primary_image_url: string;
  secondary_image_url: string;
  badge: string | null;
  colors: unknown;
};

const toProduct = (row: ProductRow) => ({
  id: String(row.id),
  name: String(row.name),
  price: Number(row.price),
  newPrice: row.new_price === null ? null : Number(row.new_price),
  primaryImage: String(row.primary_image_url),
  secondaryImage: String(row.secondary_image_url),
  badge: row.badge ? String(row.badge) : null,
  colors: parseColors(row.colors),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid product data." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const colors = normalizeColors(data.colors);

  const { id } = await params;
  const { rows } = await sql`
    UPDATE products
    SET
      name = ${data.name},
      price = ${data.price},
      new_price = ${data.newPrice ?? null},
      primary_image_url = ${data.primaryImage},
      secondary_image_url = ${data.secondaryImage},
      badge = ${data.badge ?? null},
      colors = ${JSON.stringify(colors)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id,
      name,
      price,
      new_price,
      primary_image_url,
      secondary_image_url,
      badge,
      colors
  `;

  if (!rows.length) {
    return NextResponse.json(
      { success: false, error: "Product not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    product: toProduct(rows[0] as ProductRow),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const { rowCount } = await sql`
    DELETE FROM products WHERE id = ${id}
  `;

  if (!rowCount) {
    return NextResponse.json(
      { success: false, error: "Product not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
