import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { featuredProducts } from "@/lib/products";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/contact";

const DEFAULT_SHIPPING_FEE = 2;
const DEFAULT_SHIPPING_FREE_THRESHOLD = 30;

const parsePrice = (value: string) =>
  Number(value.replace(/[^0-9.]/g, "")) || 0;

const ensureSchema = async () => {
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      new_price NUMERIC(10, 2),
      primary_image_url TEXT NOT NULL,
      secondary_image_url TEXT NOT NULL,
      badge TEXT,
      colors JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      shipping_fee NUMERIC(10, 2) NOT NULL,
      shipping_free_threshold NUMERIC(10, 2) NOT NULL,
      support_email TEXT NOT NULL,
      support_phone TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      email TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

const seedSettings = async () => {
  const { rowCount } = await sql`SELECT id FROM store_settings LIMIT 1`;
  if (rowCount && rowCount > 0) return;

  await sql`
    INSERT INTO store_settings (
      shipping_fee,
      shipping_free_threshold,
      support_email,
      support_phone
    )
    VALUES (
      ${DEFAULT_SHIPPING_FEE},
      ${DEFAULT_SHIPPING_FREE_THRESHOLD},
      ${SUPPORT_EMAIL},
      ${SUPPORT_PHONE}
    )
  `;
};

const seedProducts = async () => {
  const { rows } = await sql`SELECT COUNT(*)::int AS count FROM products`;
  const count = rows[0]?.count ?? 0;
  if (count > 0) return;

  for (const product of featuredProducts) {
    await sql`
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
        ${product.name},
        ${parsePrice(product.price)},
        ${product.newPrice ? parsePrice(product.newPrice) : null},
        ${product.primaryImage},
        ${product.secondaryImage},
        ${product.badge ?? null},
        ${JSON.stringify(product.colors ?? [])}
      )
    `;
  }
};

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_LOGIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_LOGIN_EMAIL and ADMIN_PASSWORD are required to seed admin user.",
    );
  }

  const normalizedEmail = adminEmail.trim().toLowerCase();

  const { rowCount } = await sql`
    SELECT id FROM admin_users WHERE email = ${normalizedEmail} LIMIT 1
  `;

  if (rowCount && rowCount > 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${normalizedEmail}, ${passwordHash})
  `;
};

const run = async () => {
  await ensureSchema();
  await seedSettings();
  await seedProducts();
  await seedAdmin();
  console.log("Database setup complete.");
};

run().catch((error) => {
  console.error("Database setup failed:", error);
  process.exit(1);
});
