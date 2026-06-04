import { NextResponse } from "next/server";
import {
  setAdminSessionCookie,
  validateAdminPassword,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };

    if (!body.password || !validateAdminPassword(body.password)) {
      return NextResponse.json(
        { error: "Wrong admin password." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    setAdminSessionCookie(response);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to sign in.",
      },
      { status: 500 },
    );
  }
}
