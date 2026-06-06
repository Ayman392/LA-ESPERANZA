import type { NextRequest } from "next/server";
import { updateSupabaseAuthSession } from "@/supabase/auth-proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseAuthSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
