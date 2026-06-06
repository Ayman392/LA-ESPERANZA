import { NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/supabase/auth-server";

export async function POST() {
  try {
    const authClient = await createSupabaseAuthServerClient();
    const { error } = await authClient.auth.signOut();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to sign out.",
      },
      { status: 500 },
    );
  }
}
