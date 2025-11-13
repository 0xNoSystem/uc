import { NextResponse } from "next/server";
import { Resend } from "resend";
import OrderConfirmation from "@/emails/OrderConfirmation";
import { SUPPORT_EMAIL } from "@/lib/contact";
import type { OrderConfirmationProps } from "@/emails/OrderConfirmation";

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
};

export async function POST(request: Request) {
  const resend = getResendClient();

  if (!resend) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Email service is not configured. Please set RESEND_API_KEY or NEXT_PUBLIC_RESEND_API_KEY.",
      },
      { status: 500 }
    );
  }

  let payload: OrderConfirmationProps;

  try {
    payload = (await request.json()) as OrderConfirmationProps;
  } catch (error) {
    console.error("Invalid order payload", error);
    return NextResponse.json(
      { success: false, error: "Malformed payload." },
      { status: 400 }
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? SUPPORT_EMAIL;
  const fromEmail =
    process.env.FROM_EMAIL ??
    "UNDERCONTROL Orders <orders@mail.undercontrol.dev>";

  const recipients = new Set<string>([adminEmail]);

  if (payload.shippingAddress.email) {
    recipients.add(payload.shippingAddress.email);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.from(recipients),
      subject: `Order ${payload.orderId} · ${payload.total}`,
      react: OrderConfirmation(payload), 
    });

    if (error) {
      console.error("Resend error", error);
      return NextResponse.json(
        {
          success: false,
          error: "Unable to send email via Resend.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Failed to send order email", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error while sending email.",
      },
      { status: 500 }
    );
  }
}
