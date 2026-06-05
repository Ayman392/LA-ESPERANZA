import { NextResponse } from "next/server";
import {
  createSupabaseOrder,
  StockValidationError,
} from "@/services/order-persistence";
import type { CreateOrderPayload } from "@/types/order";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateOrderPayload;

    if (!payload.items?.length) {
      return NextResponse.json(
        { error: "Cart items are required." },
        { status: 400 },
      );
    }

    const order = await createSupabaseOrder(payload);

    return NextResponse.json({
      order,
    });
  } catch (error) {
    const isStockError = error instanceof StockValidationError;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to persist order in Supabase.",
      },
      { status: isStockError ? 409 : 500 },
    );
  }
}
