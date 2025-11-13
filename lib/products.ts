import type { Product } from "@/types/product";

export const FALLBACK_COLOR = "#f5f5f5";

export const featuredProducts: Product[] = [
  {
    id: "grip",
    name: "Gym Grips",
    price: "$12.99",
    newPrice: "$6.99",
    primaryImage: "/grip-01.jpg",
    secondaryImage: "/grip-02.jpg",
    colors: ["gray", "black"],
  },
  {
    id: "light",
    name: "Undercontrol Gym Light",
    price: "$20.99",
    newPrice: "$14.99",
    primaryImage: "/light-01.jpg",
    secondaryImage: "/light-02.png",
    badge: "new",
    colors: ["black"],
  },
];

export const getDefaultColor = (productId: string) => {
  const product = featuredProducts.find((item) => item.id === productId);
  return product?.colors?.[0] ?? FALLBACK_COLOR;
};

export const formatColorLabel = (value?: string) => {
  if (!value) return "";
  if (value.startsWith("#")) {
    return value.toUpperCase();
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};
