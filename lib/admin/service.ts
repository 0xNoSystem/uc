import "server-only";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SESSION_COOKIE = "uc-admin-session";
const SESSION_DAYS = 7;
const RESET_MINUTES = 30;
const LOCK_MINUTES = 15;
const MAX_ATTEMPTS = 3;

const getAdminEmail = () => {
  const email = process.env.ADMIN_LOGIN_EMAIL;
  if (!email) {
    throw new Error("ADMIN_LOGIN_EMAIL is not configured.");
  }
  return email.trim().toLowerCase();
};

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const ensureAdminUser = async () => {
  const adminEmail = getAdminEmail();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  const { rowCount } = await sql`
    SELECT id FROM admin_users WHERE email = ${adminEmail} LIMIT 1
  `;
  if (rowCount && rowCount > 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${adminEmail}, ${passwordHash})
  `;
};

export const verifyAdminPassword = async (email: string, password: string) => {
  const { rows } = await sql`
    SELECT password_hash FROM admin_users WHERE email = ${email} LIMIT 1
  `;
  const hash = rows[0]?.password_hash as string | undefined;
  if (!hash) return false;
  return bcrypt.compare(password, hash);
};

export const getLoginAttemptStatus = async (email: string) => {
  const { rows } = await sql`
    SELECT attempts, locked_until
    FROM admin_login_attempts
    WHERE email = ${email}
  `;
  const attempts = rows[0]?.attempts ?? 0;
  const lockedUntil = rows[0]?.locked_until
    ? new Date(rows[0].locked_until)
    : null;
  return { attempts, lockedUntil };
};

export const recordFailedAttempt = async (email: string) => {
  const { attempts } = await getLoginAttemptStatus(email);
  const nextAttempts = attempts + 1;
  const lockTime =
    nextAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
      : null;
  const lockValue = lockTime ? lockTime.toISOString() : null;

  await sql`
    INSERT INTO admin_login_attempts (email, attempts, locked_until, updated_at)
    VALUES (${email}, ${nextAttempts}, ${lockValue}, NOW())
    ON CONFLICT (email)
    DO UPDATE SET
      attempts = ${nextAttempts},
      locked_until = ${lockValue},
      updated_at = NOW()
  `;

  return {
    attempts: nextAttempts,
    lockedUntil: lockTime,
    shouldSendReset: nextAttempts >= MAX_ATTEMPTS && attempts < MAX_ATTEMPTS,
  };
};

export const clearLoginAttempts = async (email: string) => {
  await sql`DELETE FROM admin_login_attempts WHERE email = ${email}`;
};

export const createAdminSession = async (email: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO admin_sessions (token_hash, email, expires_at)
    VALUES (${tokenHash}, ${email}, ${expiresAt.toISOString()})
  `;

  return { token, expiresAt };
};

export const getAdminSession = async (token: string) => {
  const tokenHash = hashToken(token);
  const { rows } = await sql`
    SELECT email, expires_at
    FROM admin_sessions
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const expiresAt = new Date(row.expires_at);
  if (expiresAt < new Date()) {
    await sql`DELETE FROM admin_sessions WHERE token_hash = ${tokenHash}`;
    return null;
  }
  return { email: row.email as string, expiresAt };
};

export const deleteAdminSession = async (token: string) => {
  const tokenHash = hashToken(token);
  await sql`DELETE FROM admin_sessions WHERE token_hash = ${tokenHash}`;
};

export const createPasswordResetToken = async (email: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);

  await sql`
    INSERT INTO password_resets (token_hash, email, expires_at)
    VALUES (${tokenHash}, ${email}, ${expiresAt.toISOString()})
  `;

  return { token, expiresAt };
};

export const consumePasswordResetToken = async (token: string) => {
  const tokenHash = hashToken(token);
  const { rows } = await sql`
    SELECT email, expires_at
    FROM password_resets
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const expiresAt = new Date(row.expires_at);
  if (expiresAt < new Date()) {
    await sql`DELETE FROM password_resets WHERE token_hash = ${tokenHash}`;
    return null;
  }
  await sql`DELETE FROM password_resets WHERE token_hash = ${tokenHash}`;
  return row.email as string;
};

export const updateAdminPassword = async (email: string, password: string) => {
  const passwordHash = await bcrypt.hash(password, 10);
  await sql`
    UPDATE admin_users
    SET password_hash = ${passwordHash}, updated_at = NOW()
    WHERE email = ${email}
  `;
};

export const adminSessionCookieName = SESSION_COOKIE;
