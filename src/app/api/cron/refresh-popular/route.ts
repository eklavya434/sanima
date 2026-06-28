import { refreshPopularContent } from "../../../../../scripts/refresh-popular";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Security check: if CRON_SECRET is configured, check authorization header
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await refreshPopularContent();
    
    return NextResponse.json({ 
      success: true, 
      message: "Popular content cache refreshed successfully" 
    });
  } catch (error: any) {
    console.error("Cron Refresh Popular Content Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
