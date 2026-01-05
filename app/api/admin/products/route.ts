import { NextResponse } from "next/server";
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

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { rows } = await sql`
    SELECT
      id,
      name,
      price,
      new_price,
      primary_image_url,
      secondary_image_url,
      badge,
      colors
    FROM products
    ORDER BY created_at DESC
  `;

  return NextResponse.json({
    success: true,
    products: rows.map((row) => toProduct(row as ProductRow)),
  });
}

export async function POST(request: Request) {
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

  const { rows } = await sql`
    INSERT INTO products (
      name,
      price,
      new_price,
      primary_image_url,
      secondary_image_url,
      badge,
      colors
    )
    VALUES (
      ${data.name},
      ${data.price},
      ${data.newPrice ?? null},
      ${data.primaryImage},
      ${data.secondaryImage},
      ${data.badge ?? null},
      ${JSON.stringify(colors)}
    )
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

  return NextResponse.json({
    success: true,
    product: rows.length ? toProduct(rows[0] as ProductRow) : null,
  });
}
