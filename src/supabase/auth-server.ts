import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/supabase/config";

export const createSupabaseAuthServerClient = async () => {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error(
      "Supabase Auth environment variables are not configured.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseConfig.url,
    supabaseConfig.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies; the proxy refreshes them.
          }
        },
      },
    },
  );
};
