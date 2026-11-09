import { NextResponse } from "next/server";
import { updateStoreCategoryAdmin, checkAdminSession } from "@/actions/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await checkAdminSession();
    if (!session || !session.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { storeId, categoryName } = body;

    if (!storeId || !categoryName) {
      return NextResponse.json(
        { success: false, error: "Missing storeId or categoryName" },
        { status: 400 }
      );
    }

    const result = await updateStoreCategoryAdmin(storeId, categoryName);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/admin/store/category error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update store category." },
      { status: 500 }
    );
  }
}

