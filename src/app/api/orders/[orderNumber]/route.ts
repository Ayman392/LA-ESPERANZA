import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/supabase/server";
import type { OrderItem, PaymentMethod, SavedOrder } from "@/types/order";

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  district: string;
  notes: string | null;
  subtotal: number | string;
  delivery_charge: number | string;
  grand_total: number | string;
  created_at: string;
};

type OrderItemRow = {
  product_id: string;
  product_slug: string;
  product_name: string;
  inspired_by: string;
  size: "15ml" | "30ml";
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
  image: string;
};

type PaymentRow = {
  method: PaymentMethod;
  sender_number: string | null;
  transaction_id: string | null;
};

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

const mapItems = (items: OrderItemRow[]): OrderItem[] =>
  items.map((item) => ({
    productId: item.product_id,
    slug: item.product_slug,
    name: item.product_name,
    inspiredBy: item.inspired_by,
    size: item.size,
    quantity: item.quantity,
    unitPrice: toNumber(item.unit_price),
    lineTotal: toNumber(item.line_total),
    image: item.image,
  }));

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await context.params;
    const supabase = createSupabaseServerClient();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, customer_id, customer_name, customer_phone, customer_email, delivery_address, district, notes, subtotal, delivery_charge, grand_total, created_at",
      )
      .eq("order_number", decodeURIComponent(orderNumber))
      .single<OrderRow>();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const [{ data: items, error: itemsError }, { data: payment, error: paymentError }] =
      await Promise.all([
        supabase
          .from("order_items")
          .select(
            "product_id, product_slug, product_name, inspired_by, size, quantity, unit_price, line_total, image",
          )
          .eq("order_id", order.id)
          .returns<OrderItemRow[]>(),
        supabase
          .from("payments")
          .select("method, sender_number, transaction_id")
          .eq("order_id", order.id)
          .single<PaymentRow>(),
      ]);

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    if (paymentError || !payment) {
      throw new Error(paymentError?.message ?? "Payment not found.");
    }

    const savedOrder: SavedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      customer: {
        customerName: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email ?? "",
        deliveryAddress: order.delivery_address,
        district: order.district,
        notes: order.notes ?? "",
      },
      payment: {
        method: payment.method,
        senderNumber: payment.sender_number ?? undefined,
        transactionId: payment.transaction_id ?? undefined,
      },
      items: mapItems(items ?? []),
      totals: {
        subtotal: toNumber(order.subtotal),
        deliveryCharge: toNumber(order.delivery_charge),
        grandTotal: toNumber(order.grand_total),
      },
      createdAt: order.created_at,
    };

    return NextResponse.json({ order: savedOrder });
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
