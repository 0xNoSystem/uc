"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types/product";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/contact";
import type { CartState } from "@/types/cart";
import { parseStoredCart } from "@/lib/cart";
import {
  FALLBACK_COLOR,
  featuredProducts,
  formatColorLabel,
  getDefaultColor,
} from "@/lib/products";

const createDefaultSelectedColors = () =>
  featuredProducts.reduce<Record<string, string>>((acc, product) => {
    acc[product.id] = product.colors?.[0] ?? FALLBACK_COLOR;
    return acc;
  }, {});

export default function Home() {
  const [cart, setCart] = useState<CartState>({});
  const [cartHydrated, setCartHydrated] = useState(false);
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>(
    createDefaultSelectedColors
  );
  const [colorsHydrated, setColorsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextCart = parseStoredCart(window.localStorage.getItem("uc-cart"));
    const frame = window.requestAnimationFrame(() => {
      setCart(nextCart);
      setSelectedColors((prev) => {
        const merged = { ...prev };
        Object.entries(nextCart).forEach(([productId, value]) => {
          if (value?.color) {
            merged[productId] = value.color;
          }
        });
        return merged;
      });
      setCartHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedSelections =
      window.localStorage.getItem("uc-selected-colors");
    const frame = window.requestAnimationFrame(() => {
      if (storedSelections) {
        try {
          const parsed = JSON.parse(storedSelections) as Record<
            string,
            unknown
          >;
          if (typeof parsed === "object" && parsed !== null) {
            setSelectedColors((prev) => {
              const merged = { ...prev };
              Object.entries(parsed).forEach(([productId, color]) => {
                if (typeof color === "string") {
                  merged[productId] = color;
                }
              });
              return merged;
            });
          }
        } catch {
          // ignore malformed selections
        }
      }
      setColorsHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem("uc-cart", JSON.stringify(cart));
  }, [cart, cartHydrated]);

  useEffect(() => {
    if (!colorsHydrated) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "uc-selected-colors",
      JSON.stringify(selectedColors)
    );
  }, [selectedColors, colorsHydrated]);

  const handleColorChange = (productId: string, color: string) => {
    setSelectedColors((prev) => {
      if (prev[productId] === color) return prev;
      return { ...prev, [productId]: color };
    });
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing || existing.color === color) {
        return prev;
      }
      return {
        ...prev,
        [productId]: { ...existing, color },
      };
    });
  };

  const incrementProduct = (productId: string, color?: string) => {
    const appliedColor =
      color ?? selectedColors[productId] ?? getDefaultColor(productId);
    setCart((prev) => {
      const prevItem = prev[productId];
      const nextQuantity = (prevItem?.quantity ?? 0) + 1;
      return {
        ...prev,
        [productId]: {
          quantity: nextQuantity,
          color: appliedColor,
        },
      };
    });
  };

  const decrementProduct = (productId: string) => {
    setCart((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const nextQuantity = current.quantity - 1;
      if (nextQuantity <= 0) {
        const rest = { ...prev };
        delete rest[productId];
        return rest;
      }
      return {
        ...prev,
        [productId]: { ...current, quantity: nextQuantity },
      };
    });
  };

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
          product: Product;
          quantity: number;
          color: string;
        } => item !== null
      );
  }, [cart]);

  const parsePrice = (value: string) =>
    Number(value.replace(/[^0-9.]/g, "")) || 0;

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
        : 3;
  const orderTotal = subtotalAfterDiscount + shippingFee;

  return (
    <main className="flex min-h-screen w-full flex-col bg-zinc-500 font-sans dark:bg-black">
      <Header cartCount={cartCount} />
      <section className="flex w-full flex-col pt-24">
        <div className="relative h-[99vh] w-full">
          <h1 className="relative z-10 top-[10%] text-center text-2xl font-semibold uppercase tracking-[0.2em] text-white drop-shadow sm:text-3xl">
            Stay Focused. Stay Fierce. Stay
            <br />
            UNDERCONTROL.
          </h1>
          <Image
            src="/uc16-min.jpg"
            alt="Undercontrol hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section
        id="products"
        className="w-full scroll-mt-32 bg-black/40 px-6 py-16 sm:px-10"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-white">
        <div className="relative md:top-20 mb-8">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70 p-1">
            Featured Products
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl ">Curated for Control</h2>
          <p className="max-w-2xl text-white/70 p-1">
            Layered textures, tactical silhouettes, and engineered fabrics designed for life in motion.
          </p>
        </div>
      <div className="relative mt-2 grid grid-cols-1 lg:grid-cols-2 gap-y-12 lg:gap-x-20 transform lg:scale-[0.8] md:gap-y-30 md:scale-[0.75] lg:bottom-0 sm:bottom-30">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart[product.id]?.quantity ?? 0}
                selectedColor={
                  selectedColors[product.id] ?? getDefaultColor(product.id)
                }
                onColorSelect={handleColorChange}
                onIncrement={incrementProduct}
                onDecrement={decrementProduct}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="checkout"
        className="w-full scroll-mt-32 bg-black/70 px-6 py-12 text-white sm:px-10"
      >
        <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/60">
                Cart Overview
              </p>
              <h3 className="text-2xl font-semibold">
                {cartDetails.length ? "Ready To Checkout" : "Your Cart Is Empty"}
              </h3>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
              {cartCount} item{cartCount === 1 ? "" : "s"}
            </div>
          </div>

          <div className="space-y-4">
            {cartDetails.length === 0 ? (
              <p className="text-sm text-white/60">
                Add a product to preview your order summary.
              </p>
            ) : (
              cartDetails.map(({ product, quantity, color }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-white/60">
                      Qty {quantity} • Color {formatColorLabel(color)} •{" "}
                      {product.newPrice ?? product.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="h-7 w-7 rounded-full bg-white/10 text-lg font-semibold"
                      onClick={() => decrementProduct(product.id)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-semibold">
                      {quantity}
                    </span>
                    <button
                      className="h-7 w-7 rounded-full bg-white text-lg font-semibold text-black"
                      onClick={() => incrementProduct(product.id, color)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Subtotal (before discount)</span>
              <span className="font-semibold">
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
              <span className="font-semibold">
                ${subtotalAfterDiscount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Shipping</span>
              <span className="font-semibold">
                {shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-white">Order Total</span>
              <span className="font-semibold text-white">
                ${orderTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {cartCount === 0 ? (
            <button
              type="button"
              className="rounded-full bg-white py-3 text-base font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled
            >
              Proceed To Checkout
            </button>
          ) : (
            <Link
              href="/checkout"
              className="rounded-full bg-white py-3 text-center text-base font-semibold uppercase tracking-wide text-black transition hover:bg-gray-100"
            >
              Proceed To Checkout
            </Link>
          )}
        </div>
      </section>

      <footer
        id="contact"
        className="bg-zinc-900 px-6 py-10 text-white/80 sm:px-10"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Contact
            </p>
            <p className="text-lg font-semibold text-white">
              Need a hand? We&apos;re here.
            </p>
          </div>
          <div className="space-y-1 text-base text-white">
            <p>Email: {SUPPORT_EMAIL}</p>
            <p>Phone: {SUPPORT_PHONE}</p>
          </div>
        </div>
        <a
          href="https://wa.me/96170505017"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 rounded-full bg-green-500 p-4 shadow-lg transition-transform hover:scale-105"
          aria-label="Chat with us on WhatsApp"
        >
          <Image src="/whatsapp.svg" width={40} height={40} alt="WhatsApp" />
        </a>
      </footer>
    </main>
  );
}
