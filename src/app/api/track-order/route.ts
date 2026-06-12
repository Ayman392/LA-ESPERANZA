import { NextResponse } from "next/server";
import {
  getTrackedOrder,
  normalizeTrackingPhone,
} from "@/services/order-tracking";
import type { OrderTrackingRequest } from "@/types/order-tracking";

export const dynamic = "force-dynamic";

const notFoundMessage = "We could not find an order with those details.";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<OrderTrackingRequest>;
    const orderNumber = payload.orderNumber?.trim() ?? "";
    const phone = payload.phone?.trim() ?? "";

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: "Order number and phone number are required." },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizeTrackingPhone(phone);

    if (orderNumber.length > 80 || normalizedPhone.length < 10) {
      return NextResponse.json({ error: notFoundMessage }, { status: 404 });
    }

    const order = await getTrackedOrder(orderNumber, phone);

    if (!order) {
      return NextResponse.json({ error: notFoundMessage }, { status: 404 });
    }

    return NextResponse.json(
      { order },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Order tracking lookup failed:", error);

    return NextResponse.json(
      { error: "We could not check your order right now. Please try again." },
      { status: 500 },
    );
  }
}
