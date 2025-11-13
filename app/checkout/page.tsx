"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import type { CartState } from "@/types/cart";
import {
  featuredProducts,
  formatColorLabel,
} from "@/lib/products";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/contact";
import { parseStoredCart } from "@/lib/cart";
import type { OrderConfirmationProps } from "@/emails/OrderConfirmation";

const placeholderImage = "/uclogo.png";

const fieldClasses =
  "mt-2 w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-white focus:outline-none";

const parsePrice = (value: string) =>
  Number(value.replace(/[^0-9.]/g, "")) || 0;

type ConfirmationData = {
  orderId: string;
  fullName: string;
  street: string;
  city: string;
  phone: string;
  email?: string;
  notes?: string;
  paymentMethod: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({});
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const [pendingEmailPayload, setPendingEmailPayload] =
    useState<OrderConfirmationProps | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextCart = parseStoredCart(window.localStorage.getItem("uc-cart"));
    const frame = window.requestAnimationFrame(() => {
      setCart(nextCart);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const cartCount = useMemo(
    () =>
      Object.values(cart).reduce((sum, item) => sum + (item?.quantity ?? 0), 0),
    [cart]
  );

  const cartDetails = useMemo(() => {
    return featuredProducts
      .map((product) => {
        const cartItem = cart[product.id];
        if (!cartItem) return null;
        return {
          product,
          quantity: cartItem.quantity,
          color: cartItem.color,
        };
      })
      .filter(
        (
          item
        ): item is {
          product: (typeof featuredProducts)[number];
          quantity: number;
          color: string;
        } => item !== null
      );
  }, [cart]);

  const subtotalBeforeDiscount = cartDetails.reduce(
    (sum, item) => sum + parsePrice(item.product.price) * item.quantity,
    0
  );

  const subtotalAfterDiscount = cartDetails.reduce(
    (sum, item) =>
      sum +
      parsePrice(item.product.newPrice ?? item.product.price) * item.quantity,
    0
  );

  const discountAmount = Math.max(
    0,
    subtotalBeforeDiscount - subtotalAfterDiscount
  );
  const shippingFee =
    subtotalAfterDiscount === 0
      ? 0
      : subtotalAfterDiscount > 30
        ? 0
        : 2;
  const orderTotal = subtotalAfterDiscount + shippingFee;
  const totalItems = cartDetails.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cartDetails.length === 0) {
      setSubmitError("Add at least one product before checking out.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const getField = (key: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value.trim() : "";
    };

    const fullName = getField("fullName") || "Friend";
    const street = getField("street") || "—";
    const city = getField("city") || "Lebanon";
    const phone = getField("phone") || "Not provided";
    const email = getField("email");
    const notes = getField("notes");
    const paymentMethod =
      getField("paymentMethod") || "Cash On Delivery";
    const orderId = `UC-${Date.now().toString(36).toUpperCase()}`;

    const shippingLabel =
      shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`;
    const subtotalLabel = `$${subtotalAfterDiscount.toFixed(2)}`;
    const totalLabel = `$${orderTotal.toFixed(2)}`;

    const lines = cartDetails.map(({ product, quantity, color }) => {
      const linePrice =
        parsePrice(product.newPrice ?? product.price) * quantity;
      return {
        name: product.name,
        color: formatColorLabel(color),
        quantity,
        price: `$${linePrice.toFixed(2)}`,
      };
    });

    setSubmitError(null);
    const payload = {
      customerName: fullName,
      orderId,
      subtotal: subtotalLabel,
      total: totalLabel,
      shipping: shippingLabel,
      lines,
      shippingAddress: {
        street,
        city,
        phone,
        email: email || undefined,
      },
    };
    setPendingEmailPayload(payload);
    setConfirmationData({
      orderId,
      fullName,
      street,
      city,
      phone,
      email: email || undefined,
      notes,
      paymentMethod,
    });
  };

  const handlePassOrder = async () => {
    if (!pendingEmailPayload) return;
    setIsSendingEmail(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/order-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pendingEmailPayload),
      });
      const result = (await response.json().catch(() => null)) as
        | { success: true; id?: string }
        | { success: false; error?: string }
        | null;

      if (!response.ok || !result?.success) {
        setSubmitError(
            "We couldn't send the order email. Please try again."
        );
        return;
      }

      setPendingEmailPayload(null);
      setConfirmationData(null);
      setCart({});
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("uc-cart");
      }
      router.push("/");
    } catch (error) {
      console.error("Failed to pass order", error);
      setSubmitError(
        "Unable to reach the email service. Please try again in a moment."
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const closeModal = () => {
    setConfirmationData(null);
    setPendingEmailPayload(null);
  };

  return (
    <main className="min-h-screen w-full bg-black text-white">
      <Header cartCount={cartCount} />
      <section className="flex min-h-screen flex-col px-6 pb-16 pt-28 sm:px-10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="relative min-h-[480px] overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <Image
              src={placeholderImage}
              alt="Checkout visual placeholder"
              fill
              sizes="40vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <p className="absolute bottom-8 left-8 text-xs uppercase tracking-[0.4em] text-white/70">
              UnderControl
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Checkout
                </p>
                <h1 className="mt-1 text-3xl font-semibold">
                  Shipping Information
                </h1>
              </div>
              <Link
                href="/"
                className="text-sm font-semibold uppercase tracking-wide text-white/70 hover:text-white"
              >
                Back to Store
              </Link>
            </div>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  required
                  autoComplete="name"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Street Address
                </label>
                <input
                  type="text"
                  name="street"
                  placeholder="eg. Hamra Main Road, Bldg 12"
                  required
                  autoComplete="street-address"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="eg. Zalka"
                  required
                  autoComplete="address-level2"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+961 70 000 000"
                  required
                  autoComplete="tel"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Email{" "}
                  <span className="text-white/40 lowercase">(optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={fieldClasses}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                    Delivery Notes
                  </label>
                  <textarea
                    name="notes"
                    placeholder="Gate code, preferred drop-off, etc."
                    className={`${fieldClasses} min-h-[110px] resize-none`}
                  />
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/70">
                  <p className="font-semibold text-white">Need help?</p>
                  <p className="mt-2">
                    Email <span className="text-white">{SUPPORT_EMAIL}</span> or
                    call <span className="text-white">{SUPPORT_PHONE}</span>.
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Payment Method
                </label>
                <div className="mt-3 space-y-3">
                  <label className="flex items-start gap-3 rounded-2xl border border-white/20 bg-black/40 p-4 text-sm text-white">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      defaultChecked
                      className="mt-1 h-4 w-4 accent-white"
                    />
                    <div>
                      <p className="font-semibold text-white">
                        Cash On Delivery
                      </p>
                      <p className="text-xs text-white/60">
                        Pay the courier in cash when your order arrives.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-white py-3 text-base font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={cartDetails.length === 0}
              >
                Confirm Order
              </button>
              {submitError ? (
                <p className="text-center text-sm text-rose-300">
                  {submitError}
                </p>
              ) : null}
            </form>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                    Order Summary
                  </p>
                  <h2 className="text-2xl font-semibold">
                    {totalItems
                      ? `${totalItems} item${totalItems === 1 ? "" : "s"}`
                      : "No items in cart"}
                  </h2>
                </div>
                <Link
                  href="/#products"
                  className="text-xs font-semibold uppercase tracking-wide text-white/70 hover:text-white"
                >
                  Modify Cart
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {cartDetails.length === 0 ? (
                  <p className="text-sm text-white/60">
                    Your cart is empty. Head back and add a product before checking
                    out, you silly goose.
                  </p>
                ) : (
                  cartDetails.map(({ product, quantity, color }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-white">{product.name}</p>
                        <p className="text-white/60">
                          Color {formatColorLabel(color)} · Qty {quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {product.newPrice ?? product.price}
                        </p>
                        {product.newPrice ? (
                          <p className="text-xs text-white/50 line-through">
                            {product.price}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Subtotal</span>
                  <span className="font-semibold text-white">
                    ${subtotalBeforeDiscount.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-300">
                    <span className="font-semibold">Discounts</span>
                    <span>- ${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/70">Total After Discounts</span>
                  <span className="font-semibold text-white">
                    ${subtotalAfterDiscount.toFixed(2)}
                  </span>
                </div>
              <div className="flex justify-between text-white/70">
                  <span>Shipping (Lebanon)</span>
                  <span
                    className={`font-semibold ${
                      shippingFee === 0 ? "text-emerald-300" : "text-white"
                    }`}
                  >
                    {shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-base text-white">
                  <span>Order Total</span>
                  <span className="font-semibold">
                    ${orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {confirmationData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-black/90 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Order Confirmation
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  Ready to pass this order?
                </h3>
                <p className="text-sm text-white/70">
                  Order ID: {confirmationData.orderId}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/70 hover:border-white/50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Items</span>
                <span className="font-semibold text-white">
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Subtotal</span>
                <span className="font-semibold text-white">
                  ${subtotalAfterDiscount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Shipping</span>
                <span
                  className={`font-semibold ${
                    shippingFee === 0 ? "text-emerald-300" : "text-white"
                  }`}
                >
                  {shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-white">Total</span>
                <span className="text-xl font-semibold text-white">
                  ${orderTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Shipping To
              </p>
              <p className="font-semibold">
                {confirmationData.fullName || "Name not provided"}
              </p>
              <p className="text-white/80">
                {confirmationData.street || "Street not provided"}
                <br />
                {confirmationData.city || "Lebanon"}
              </p>
              <p className="text-white/70">
                Phone: {confirmationData.phone || "Not provided"}
                <br />
                Email:{" "}
                {confirmationData.email && confirmationData.email.length > 0
                  ? confirmationData.email
                  : "Not provided"}
              </p>
              {confirmationData.notes ? (
                <p className="text-white/70">
                  Notes: {confirmationData.notes}
                </p>
              ) : null}
              <p className="text-white/80">
                Payment:{" "}
                {confirmationData.paymentMethod || "Cash On Delivery"}
              </p>
              <p className="text-xs text-white/60">
                {confirmationData.email
                  ? "A copy of this summary was emailed to you."
                  : "No email provided — we will follow up on WhatsApp using the number above."}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePassOrder}
              className="mt-6 w-full rounded-full bg-white py-3 text-base font-semibold uppercase tracking-wide text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSendingEmail || !pendingEmailPayload}
            >
              {isSendingEmail ? "Sending..." : "Pass Order"}
            </button>
            {submitError ? (
              <p className="mt-2 text-center text-sm text-rose-300">
                {submitError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
