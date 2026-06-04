import { NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/admin-auth";
import {
  deleteAdminProduct,
  updateAdminProduct,
} from "@/services/admin-dashboard";
import type { AdminProductInput } from "@/types/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    assertAdminAccess(request.headers);
    const { productId } = await context.params;
    const product = (await request.json()) as AdminProductInput;

    await updateAdminProduct(productId, product);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update product.",
      },
      { status: error instanceof Error && error.message.includes("denied") ? 401 : 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  try {
    assertAdminAccess(request.headers);
    const { productId } = await context.params;

    await deleteAdminProduct(productId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete product.",
      },
      { status: error instanceof Error && error.message.includes("denied") ? 401 : 500 },
    );
  }
}
