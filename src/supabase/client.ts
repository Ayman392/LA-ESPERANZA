"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/supabase/config";

let browserClient: SupabaseClient | null = null;

export const createSupabaseBrowserClient = () => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  browserClient ??= createClient(supabaseConfig.url, supabaseConfig.anonKey);

  return browserClient;
};
