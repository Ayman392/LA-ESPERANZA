export const ADMIN_ACCESS_HEADER = "x-admin-access-key";

export const getAdminAccessMode = () =>
  process.env.ADMIN_ACCESS_KEY ? "key" : "phase8-placeholder";

// Phase 7 prepares the guard surface; Phase 8 can replace this with real auth.
export const assertAdminAccess = (headers: Headers) => {
  const configuredKey = process.env.ADMIN_ACCESS_KEY;

  if (!configuredKey) {
    return;
  }

  if (headers.get(ADMIN_ACCESS_HEADER) !== configuredKey) {
    throw new Error("Admin access denied.");
  }
};

export const getAdminRequestHeaders = () => {
  const headers: Record<string, string> = {};
  const browserKey =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem("la-esperanza-admin-key")
      : null;

  if (browserKey) {
    headers[ADMIN_ACCESS_HEADER] = browserKey;
  }

  return headers;
};
