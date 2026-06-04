import { NextResponse } from "next/server";
import { assertAdminAccess, getAdminAccessMode } from "@/lib/admin-auth";
import { getAdminDashboardData } from "@/services/admin-dashboard";

export async function GET(request: Request) {
  try {
    assertAdminAccess(request.headers);
    const data = await getAdminDashboardData();

    return NextResponse.json({
      ...data,
      accessMode: getAdminAccessMode(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load dashboard.",
      },
      { status: error instanceof Error && error.message.includes("denied") ? 401 : 500 },
    );
  }
}
