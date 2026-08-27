import { getLiveHomepageData } from "@/actions/marketplace";
import SearchClient from "./SearchClient";

export const revalidate = 0; // Real-time catalog

export default async function SearchPage() {
  const data = await getLiveHomepageData();

  return (
    <SearchClient
      initialCatalog={data.success ? data.products : []}
      initialStores={data.success ? data.stores : []}
    />
  );
}
