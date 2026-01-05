import type { CartState } from "@/types/cart";
import { FALLBACK_COLOR, getDefaultColor } from "@/lib/products";

type ProductLike = {
  id: string;
  colors?: string[];
};

export const parseStoredCart = (
  payload: string | null,
  products: ProductLike[] = [],
): CartState => {
  if (!payload) return {};
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }
    return Object.entries(parsed).reduce<CartState>(
      (acc, [productId, value]) => {
        if (typeof value === "number") {
          if (value <= 0) return acc;
          acc[productId] = {
            quantity: value,
            color: getDefaultColor(productId, products) ?? FALLBACK_COLOR,
          };
          return acc;
        }
        if (
          typeof value === "object" &&
          value !== null &&
          typeof (value as { quantity?: unknown }).quantity === "number"
        ) {
          const quantity = (value as { quantity: number }).quantity;
          if (quantity <= 0) return acc;
          const colorCandidate = (value as { color?: unknown }).color;
          const color =
            typeof colorCandidate === "string"
              ? colorCandidate
              : (getDefaultColor(productId, products) ?? FALLBACK_COLOR);
          acc[productId] = { quantity, color };
        }
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};
