import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/supabase/config";

export const createSupabaseServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseConfig.url || !serviceRoleKey) {
    throw new Error(
      "Supabase service role environment variables are not configured.",
    );
  }

  return createClient(supabaseConfig.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
