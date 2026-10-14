import { getLiveHomepageData } from "@/actions/marketplace";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Real-time catalog

export default async function SearchPage() {
  let initialCatalog: any[] = [];
  let initialStores: any[] = [];

  try {
    const data = await getLiveHomepageData();
    if (data && data.success) {
      initialCatalog = data.products || [];
      initialStores = data.stores || [];
    }
  } catch (err) {
    console.error("Error prefetching search data in SearchPage:", err);
  }

  return (
    <SearchClient
      initialCatalog={initialCatalog}
      initialStores={initialStores}
    />
  );
}

