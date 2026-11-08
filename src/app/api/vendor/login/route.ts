import { NextResponse } from "next/server";
import { authenticateVendor } from "@/actions/vendor";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const result = await authenticateVendor(email, password);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/vendor/login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}

