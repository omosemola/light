import { NextRequest, NextResponse } from "next/server";
import { 
  checkAdminSession, 
  getAdminOverviewMetrics,
  getAdminProductsPaginated,
  getAdminOrdersPaginated,
  getAdminStoresPaginated,
  getAdminUsersPaginated,
  getAdminTicketsPaginated,
  getAdminDashboardData
} from "@/actions/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const reqStart = performance.now();
  try {
    const session = await checkAdminSession();
    if (!session || !session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin login required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") || "overview";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "ALL";

    let data: any = null;

    if (section === "overview") {
      data = await getAdminOverviewMetrics();
    } else if (section === "products") {
      data = await getAdminProductsPaginated({
        page,
        limit,
        search,
        categoryId: searchParams.get("categoryId") || filter,
        status: (searchParams.get("status") || "ALL") as any,
      });
    } else if (section === "orders") {
      data = await getAdminOrdersPaginated({
        page,
        limit,
        search,
        status: filter !== "ALL" ? filter : undefined,
        storeId: searchParams.get("storeId") || "ALL",
      });
    } else if (section === "stores") {
      data = await getAdminStoresPaginated({
        page,
        limit,
        search,
        category: filter !== "ALL" ? filter : undefined,
      });
    } else if (section === "users") {
      data = await getAdminUsersPaginated({
        page,
        limit,
        search,
        role: filter !== "ALL" ? (filter as any) : "ALL",
      });
    } else if (section === "tickets") {
      data = await getAdminTicketsPaginated({
        page,
        limit,
        status: filter !== "ALL" ? (filter as any) : "ALL",
      });
    } else {
      data = await getAdminDashboardData();
    }

    const totalDurationMs = Math.round(performance.now() - reqStart);
    const dbDurationMs = data?.queryDurationMs || totalDurationMs;

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Server-Timing": `db;dur=${dbDurationMs}, total;dur=${totalDurationMs}`,
        "X-Response-Time-Ms": `${totalDurationMs}`,
        "X-Database-Time-Ms": `${dbDurationMs}`,
      },
    });
  } catch (error: any) {
    console.error("API /api/admin/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
