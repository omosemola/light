import { getLiveHomepageData } from "@/actions/marketplace";
import HomeClient from "./HomeClient";

// Incremental Static Regeneration (ISR): Cache rendered HTML at Edge CDN for 60 seconds
// Delivers instant 20ms-50ms TTFB on low internet speeds while maintaining fresh catalog data.
export const revalidate = 60;

export default async function Page() {
  const data = await getLiveHomepageData();

  return (
    <HomeClient
      initialProducts={data.success ? data.products : []}
      initialStores={data.success ? data.stores : []}
    />
  );
}
