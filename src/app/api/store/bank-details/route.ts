import { NextResponse } from "next/server";
import { getStoreBankDetails } from "@/actions/vendor";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get("identifier");

    if (!identifier || !identifier.trim()) {
      return NextResponse.json({ success: false, bankDetails: null }, { status: 400 });
    }

    const res = await getStoreBankDetails(identifier.trim());
    return NextResponse.json(res, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err: any) {
    console.error("API /api/store/bank-details error:", err);
    return NextResponse.json({ success: false, bankDetails: null, error: err.message }, { status: 500 });
  }
}

