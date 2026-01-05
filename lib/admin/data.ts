import { sql } from "@vercel/postgres";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/contact";

export type AdminProduct = {
  id: string;
  name: string;
  price: number;
  newPrice: number | null;
  primaryImage: string;
  secondaryImage: string;
  badge: string | null;
  colors: string[];
};

export type AdminSettings = {
  shippingFee: number;
  shippingFreeThreshold: number;
  supportEmail: string;
  supportPhone: string;
};

const parseNumeric = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toArray = (value: unknown): string[] => {
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

export const getAdminProducts = async (): Promise<AdminProduct[]> => {
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

  return rows.map((row) => {
    const priceValue = parseNumeric(row.price) ?? 0;
    const newPriceValue = parseNumeric(row.new_price);
    return {
      id: String(row.id),
      name: String(row.name),
      price: priceValue,
      newPrice: newPriceValue,
      primaryImage: String(row.primary_image_url),
      secondaryImage: String(row.secondary_image_url),
      badge: row.badge ? String(row.badge) : null,
      colors: toArray(row.colors),
    };
  });
};

export const getAdminSettings = async (): Promise<AdminSettings> => {
  const { rows } = await sql`
    SELECT
      shipping_fee,
      shipping_free_threshold,
      support_email,
      support_phone
    FROM store_settings
    ORDER BY id
    LIMIT 1
  `;

  if (rows.length === 0) {
    return {
      shippingFee: 2,
      shippingFreeThreshold: 30,
      supportEmail: SUPPORT_EMAIL,
      supportPhone: SUPPORT_PHONE,
    };
  }

  const row = rows[0];
  return {
    shippingFee: parseNumeric(row.shipping_fee) ?? 2,
    shippingFreeThreshold: parseNumeric(row.shipping_free_threshold) ?? 30,
    supportEmail: String(row.support_email),
    supportPhone: String(row.support_phone),
  };
};
