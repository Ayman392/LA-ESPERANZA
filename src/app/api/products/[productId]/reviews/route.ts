import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAuthServerClient } from "@/supabase/auth-server";
import {
  createProductReview,
  getApprovedProductReviews,
} from "@/services/reviews";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
    const pageSize = Number(
      request.nextUrl.searchParams.get("pageSize") ?? 5,
    );
    const reviews = await getApprovedProductReviews(
      productId,
      page,
      pageSize,
    );

    return NextResponse.json(reviews, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to load reviews.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { productId } = await context.params;
    const body = (await request.json()) as {
      customerName?: string;
      customerEmail?: string;
      rating?: number;
      reviewText?: string;
    };
    let userId: string | undefined;

    try {
      const authClient = await createSupabaseAuthServerClient();
      const {
        data: { user },
      } = await authClient.auth.getUser();
      userId = user?.id;
    } catch {
      // Guest reviews remain supported; authenticated reviews retain user_id.
    }

    const result = await createProductReview({
      productId,
      customerName: body.customerName ?? "",
      customerEmail: body.customerEmail,
      rating: Number(body.rating ?? 0),
      reviewText: body.reviewText ?? "",
      userId,
    });

    return NextResponse.json(
      {
        ok: true,
        verifiedPurchase: result.verifiedPurchase,
        message: "Your review was submitted for approval.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to submit review.",
      },
      { status: 400 },
    );
  }
}
