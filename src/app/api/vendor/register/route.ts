import { NextResponse } from "next/server";
import { registerVendorStore } from "@/actions/vendor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await registerVendorStore(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/vendor/register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register vendor store." },
      { status: 500 }
    );
  }
}

