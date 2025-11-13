import OrderConfirmation, {
  type OrderConfirmationProps,
} from "@/emails/OrderConfirmation";

export const renderOrderConfirmation = (payload: OrderConfirmationProps) => {
  return <OrderConfirmation {...payload} />;
};
