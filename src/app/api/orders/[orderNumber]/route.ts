import { NextResponse } from "next/server";
import { getSupabaseOrderByNumber } from "@/services/order-persistence";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await context.params;
    const order = await getSupabaseOrderByNumber(decodeURIComponent(orderNumber));

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load order from Supabase.",
      },
      { status: 500 },
    );
  }
}
