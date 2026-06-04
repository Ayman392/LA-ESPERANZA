import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/admin-session";
import { updateAdminOrderStatus } from "@/services/admin-dashboard";
import type { AdminOrderStatus } from "@/types/admin";

const allowedStatuses: AdminOrderStatus[] = [
  "pending",
  "payment_verification",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    assertAdminAccess(request);
    const { orderId } = await context.params;
    const body = (await request.json()) as { status?: AdminOrderStatus };

    if (!body.status || !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
    }

    await updateAdminOrderStatus(orderId, body.status);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update order.",
      },
      { status: error instanceof Error && error.message.includes("Admin session") ? 401 : 500 },
    );
  }
}
