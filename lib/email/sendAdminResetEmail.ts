import { Resend } from "resend";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  return new Resend(apiKey);
};

export type AdminResetEmailInput = {
  to: string;
  resetUrl: string;
  adminEmail: string;
};

export const sendAdminResetEmail = async ({
  to,
  resetUrl,
  adminEmail,
}: AdminResetEmailInput) => {
  const resend = getResendClient();
  const fromEmail =
    process.env.FROM_EMAIL ??
    "Undercontrol Admin <admin@mail.undercontrol.dev>";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h2 style="margin: 0 0 12px;">Reset your admin password</h2>
      <p style="margin: 0 0 12px;">We received multiple failed login attempts for ${adminEmail}.</p>
      <p style="margin: 0 0 16px;">Use the button below to set a new password:</p>
      <p style="margin: 0 0 24px;">
        <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 18px; border-radius: 999px; font-weight: 600;">Reset password</a>
      </p>
      <p style="margin: 0 0 8px; font-size: 12px; color: #555;">If the button does not work, copy this link:</p>
      <p style="margin: 0; font-size: 12px; color: #555;">${resetUrl}</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Reset your Undercontrol admin password",
    html,
  });

  if (error) {
    throw new Error("Resend failed to send reset email.");
  }
};
