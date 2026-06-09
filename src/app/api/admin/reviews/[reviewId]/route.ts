import { NextRequest, NextResponse } from "next/server";
import {
  assertAdminAccess,
  getAdminAccessErrorStatus,
} from "@/lib/admin-session";
import { deleteReview, moderateReview } from "@/services/reviews";

type RouteContext = {
  params: Promise<{ reviewId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await assertAdminAccess();
    const { reviewId } = await context.params;
    const body = (await request.json()) as {
      action?: "approve" | "reject";
    };

    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json(
        { error: "Invalid review action." },
        { status: 400 },
      );
    }

    await moderateReview(
      reviewId,
      body.action === "approve" ? "approved" : "rejected",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update review.",
      },
      { status: getAdminAccessErrorStatus(error) },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    await assertAdminAccess();
    const { reviewId } = await context.params;
    await deleteReview(reviewId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to delete review.",
      },
      { status: getAdminAccessErrorStatus(error) },
    );
  }
}
