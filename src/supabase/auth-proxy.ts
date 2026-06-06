import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/supabase/config";

export const updateSupabaseAuthSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    return response;
  }

  const supabase = createServerClient(
    supabaseConfig.url,
    supabaseConfig.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // This server call validates and refreshes the cookie-backed Auth session.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isLoginRoute =
    pathname === "/admin/login" || pathname === "/api/admin/login";
  const isProtectedAdminPage =
    pathname.startsWith("/admin") && !isLoginRoute;
  const isProtectedAdminApi =
    pathname.startsWith("/api/admin") &&
    !isLoginRoute &&
    pathname !== "/api/admin/logout";

  if (!user && isProtectedAdminPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";

    return NextResponse.redirect(loginUrl);
  }

  if (!user && isProtectedAdminApi) {
    return NextResponse.json(
      { error: "Admin session is invalid or expired." },
      { status: 401 },
    );
  }

  return response;
};
