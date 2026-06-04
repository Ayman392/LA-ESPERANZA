import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "la_esperanza_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const getAdminSecret = () => process.env.ADMIN_ACCESS_KEY ?? "";

const signSession = (expiresAt: number) =>
  createHmac("sha256", getAdminSecret()).update(String(expiresAt)).digest("hex");

const safeCompare = (first: string, second: string) => {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
};

export const validateAdminPassword = (password: string) => {
  const configuredPassword = getAdminSecret();

  if (!configuredPassword) {
    throw new Error("ADMIN_ACCESS_KEY is not configured.");
  }

  return safeCompare(password, configuredPassword);
};

export const createAdminSessionToken = () => {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;

  return `${expiresAt}.${signSession(expiresAt)}`;
};

export const isValidAdminSessionToken = (token?: string) => {
  const configuredPassword = getAdminSecret();

  if (!configuredPassword || !token) {
    return false;
  }

  const [expiresAtValue, signature] = token.split(".");
  const expiresAt = Number(expiresAtValue);

  if (!expiresAt || !signature || expiresAt < Date.now()) {
    return false;
  }

  return safeCompare(signature, signSession(expiresAt));
};

export const hasAdminSession = async () => {
  const cookieStore = await cookies();

  return isValidAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
};

export const setAdminSessionCookie = (response: NextResponse) => {
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const clearAdminSessionCookie = (response: NextResponse) => {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
};

export const assertAdminAccess = (request: NextRequest) => {
  const isValid = isValidAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (!isValid) {
    throw new Error("Admin session is invalid or expired.");
  }
};
