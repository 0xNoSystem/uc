export const SHIPPING_FEE = 3;
export const FREE_SHIPPING_THRESHOLD = 300;

export const getShippingFee = (subtotalAfterDiscount: number) => {
  if (subtotalAfterDiscount === 0) return 0;
  if (subtotalAfterDiscount > FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_FEE;
};
