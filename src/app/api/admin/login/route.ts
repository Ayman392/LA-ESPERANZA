import { NextResponse } from "next/server";
import { getAdminFromProfile } from "@/lib/admin-session";
import { createSupabaseAuthServerClient } from "@/supabase/auth-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();

    if (!email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const authClient = await createSupabaseAuthServerClient();
    const {
      data: { user },
      error,
    } = await authClient.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid admin email or password." },
        { status: 401 },
      );
    }

    const admin = await getAdminFromProfile(user);

    if (!admin) {
      await authClient.auth.signOut();
      return NextResponse.json(
        { error: "This account does not have admin access." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      admin: {
        id: user.id,
        email: user.email ?? email,
        role: "admin",
      },
    });
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
