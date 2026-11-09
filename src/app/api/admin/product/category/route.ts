import { NextResponse } from "next/server";
import { updateProductCategoryAdmin, checkAdminSession } from "@/actions/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await checkAdminSession();
    if (!session || !session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin login required." }, { status: 401 });
    }

    const body = await req.json();
    const { productId, categoryIdOrName } = body;

    if (!productId || !categoryIdOrName) {
      return NextResponse.json(
        { success: false, error: "Missing productId or categoryIdOrName" },
        { status: 400 }
      );
    }

    const result = await updateProductCategoryAdmin(productId, categoryIdOrName);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/admin/product/category error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product category." },
      { status: 500 }
    );
  }
}

