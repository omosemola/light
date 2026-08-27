import { getLiveHomepageData } from "@/actions/marketplace";
import HomeClient from "./HomeClient";

export const revalidate = 0; // Dynamic real-time catalog

export default async function Page() {
  const data = await getLiveHomepageData();

  return (
    <HomeClient
      initialProducts={data.success ? data.products : []}
      initialStores={data.success ? data.stores : []}
    />
  );
}
