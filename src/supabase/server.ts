import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/supabase/config";

export const createSupabaseServerClient = () => {
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseConfig.anonKey;

  if (!supabaseConfig.url || !serverKey) {
    throw new Error("Supabase server environment variables are not configured.");
  }

  return createClient(supabaseConfig.url, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
