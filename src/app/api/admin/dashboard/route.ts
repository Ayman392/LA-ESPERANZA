import { NextRequest, NextResponse } from "next/server";
import {
  assertAdminAccess,
  getAdminAccessErrorStatus,
} from "@/lib/admin-session";
import { getAdminDashboardData } from "@/services/admin-dashboard";

export async function GET(request: NextRequest) {
  try {
    await assertAdminAccess();
    const data = await getAdminDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load dashboard.",
      },
      { status: getAdminAccessErrorStatus(error) },
    );
  }
}
