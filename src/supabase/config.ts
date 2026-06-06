// Supabase configuration lives here when backend features are introduced.
// The foundation keeps these keys centralized without creating a client yet.
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  publishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
};

export const isSupabaseConfigured = Boolean(
  supabaseConfig.url && supabaseConfig.publishableKey,
);
