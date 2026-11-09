import { NextResponse } from "next/server";
import { getAdminDashboardData, checkAdminSession } from "@/actions/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await checkAdminSession();
    if (!session || !session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin login required." }, { status: 401 });
    }

    const data = await getAdminDashboardData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API /api/admin/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
