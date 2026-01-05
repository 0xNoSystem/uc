import CheckoutClient from "@/components/CheckoutClient";
import { getStoreProducts, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [products, settings] = await Promise.all([
    getStoreProducts(),
    getStoreSettings(),
  ]);

  return <CheckoutClient products={products} settings={settings} />;
}
