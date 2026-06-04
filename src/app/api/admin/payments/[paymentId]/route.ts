import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/admin-session";
import {
  rejectAdminPayment,
  verifyAdminPayment,
} from "@/services/admin-dashboard";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ paymentId: string }> },
) {
  try {
    assertAdminAccess(request);
    const { paymentId } = await context.params;
    const body = (await request.json()) as {
      action?: "verify" | "reject";
      rejectionReason?: string;
    };

    if (body.action === "verify") {
      await verifyAdminPayment(paymentId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "reject") {
      if (!body.rejectionReason?.trim()) {
        return NextResponse.json(
          { error: "Rejection reason is required." },
          { status: 400 },
        );
      }

      await rejectAdminPayment(paymentId, body.rejectionReason.trim());
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid payment action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update payment.",
      },
      { status: error instanceof Error && error.message.includes("Admin session") ? 401 : 500 },
    );
  }
}
