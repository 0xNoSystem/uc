export type CartItem = {
  quantity: number;
  color: string;
};

export type CartState = Record<string, CartItem>;
