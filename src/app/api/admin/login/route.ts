import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/supabase/auth-server";
import { createSupabaseServerClient } from "@/supabase/server";

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

    const serviceClient = createSupabaseServerClient();
    const { data: admin, error: roleError } = await serviceClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle<{ user_id: string }>();

    if (roleError) {
      await authClient.auth.signOut();
      throw new Error(`Unable to verify admin role: ${roleError.message}`);
    }

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
