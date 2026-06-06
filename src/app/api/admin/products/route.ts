import { NextRequest, NextResponse } from "next/server";
import {
  assertAdminAccess,
  getAdminAccessErrorStatus,
} from "@/lib/admin-session";
import { createAdminProduct } from "@/services/admin-dashboard";
import type { AdminProductInput } from "@/types/admin";

export async function POST(request: NextRequest) {
  try {
    await assertAdminAccess();
    const product = (await request.json()) as AdminProductInput;

    await createAdminProduct(product);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create product.",
      },
      { status: getAdminAccessErrorStatus(error) },
    );
  }
}
