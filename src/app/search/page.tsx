import { getLiveSearchCatalog } from "@/actions/marketplace";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Real-time catalog

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const initialQuery = firstParam(params.q).slice(0, 100);
  const initialCategory = firstParam(params.category).slice(0, 50);

  let initialCatalog: any[] = [];
  let initialStores: any[] = [];

  try {
    const data = await getLiveSearchCatalog();
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
      initialQuery={initialQuery}
      initialCategory={initialCategory}
    />
  );
}
