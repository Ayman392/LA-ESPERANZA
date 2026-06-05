import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/admin-session";
import { updateAdminProductVariant } from "@/services/admin-dashboard";

type InventoryUpdatePayload = {
  stockQuantity: number;
  lowStockThreshold: number;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ variantId: string }> },
) {
  try {
    assertAdminAccess(request);
    const { variantId } = await context.params;
    const payload = (await request.json()) as InventoryUpdatePayload;

    await updateAdminProductVariant(
      variantId,
      payload.stockQuantity,
      payload.lowStockThreshold,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update inventory.",
      },
      {
        status:
          error instanceof Error && error.message.includes("Admin session")
            ? 401
            : 500,
      },
    );
  }
}
