import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAuthServerClient } from "@/supabase/auth-server";
import { isSupabaseConfigured } from "@/supabase/config";
import { createSupabaseServerClient } from "@/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  role: "admin";
};

export class AdminAccessError extends Error {
  status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
  }
}

const getAdminRole = async (user: User) => {
  const serviceClient = createSupabaseServerClient();
  const { data, error } = await serviceClient
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle<{ user_id: string; role: "admin" }>();

  if (error) {
    throw new Error(`Unable to verify admin role: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    role: data.role,
  } satisfies AdminUser;
};

// Supabase verifies the access token before the private role table is queried.
export const getCurrentAdmin = async (): Promise<AdminUser | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const authClient = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    return null;
  }

  return getAdminRole(user);
};

export const hasAdminSession = async () =>
  Boolean(await getCurrentAdmin());

export const assertAdminAccess = async () => {
  const authClient = await createSupabaseAuthServerClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    throw new AdminAccessError(
      "Admin session is invalid or expired.",
      401,
    );
  }

  const admin = await getAdminRole(user);

  if (!admin) {
    throw new AdminAccessError(
      "This account does not have admin access.",
      403,
    );
  }

  return admin;
};

export const getAdminAccessErrorStatus = (error: unknown) =>
  error instanceof AdminAccessError ? error.status : 500;
