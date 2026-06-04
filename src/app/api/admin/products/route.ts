import { NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/admin-auth";
import { createAdminProduct } from "@/services/admin-dashboard";
import type { AdminProductInput } from "@/types/admin";

export async function POST(request: Request) {
  try {
    assertAdminAccess(request.headers);
    const product = (await request.json()) as AdminProductInput;

    await createAdminProduct(product);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create product.",
      },
      { status: error instanceof Error && error.message.includes("denied") ? 401 : 500 },
    );
  }
}
