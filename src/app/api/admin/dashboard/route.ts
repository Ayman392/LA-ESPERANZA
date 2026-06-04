import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/admin-session";
import { getAdminDashboardData } from "@/services/admin-dashboard";

export async function GET(request: NextRequest) {
  try {
    assertAdminAccess(request);
    const data = await getAdminDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load dashboard.",
      },
      { status: error instanceof Error && error.message.includes("Admin session") ? 401 : 500 },
    );
  }
}
