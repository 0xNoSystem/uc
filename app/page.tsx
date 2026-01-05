import HomePageClient from "@/components/HomePageClient";
import { getStoreProducts, getStoreSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, settings] = await Promise.all([
    getStoreProducts(),
    getStoreSettings(),
  ]);

  return <HomePageClient products={products} settings={settings} />;
}
