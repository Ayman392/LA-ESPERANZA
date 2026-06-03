import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/supabase/server";
import {
  generateOrderNumber,
  paymentMethodLabels,
} from "@/lib/orders";
import type { CreateOrderPayload, SavedOrder } from "@/types/order";

type CustomerRecord = {
  id: string;
};

type OrderRecord = {
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

const toNumber = (value: number | string) =>
  typeof value === "number" ? value : Number(value);

const createCustomer = async (
  supabase: ReturnType<typeof createSupabaseServerClient>,
  customer: CreateOrderPayload["customer"],
) => {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: customer.customerName,
      phone: customer.phone,
      email: customer.email || null,
      delivery_address: customer.deliveryAddress,
      district: customer.district,
      notes: customer.notes || null,
    })
    .select("id")
    .single<CustomerRecord>();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create customer.");
  }

  return data;
};

const mapOrderResponse = (
  order: OrderRecord,
  payload: CreateOrderPayload,
): SavedOrder => ({
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
  payment: payload.payment,
  items: payload.items,
  totals: {
    subtotal: toNumber(order.subtotal),
    deliveryCharge: toNumber(order.delivery_charge),
    grandTotal: toNumber(order.grand_total),
  },
  createdAt: order.created_at,
});

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateOrderPayload;

    if (!payload.items?.length) {
      return NextResponse.json(
        { error: "Cart items are required." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const customer = await createCustomer(supabase, payload.customer);
    const orderNumber = generateOrderNumber();

    // Orders keep a customer snapshot so confirmations remain stable over time.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        customer_name: payload.customer.customerName,
        customer_phone: payload.customer.phone,
        customer_email: payload.customer.email || null,
        delivery_address: payload.customer.deliveryAddress,
        district: payload.customer.district,
        notes: payload.customer.notes || null,
        subtotal: payload.totals.subtotal,
        delivery_charge: payload.totals.deliveryCharge,
        grand_total: payload.totals.grandTotal,
      })
      .select(
        "id, order_number, customer_id, customer_name, customer_phone, customer_email, delivery_address, district, notes, subtotal, delivery_charge, grand_total, created_at",
      )
      .single<OrderRecord>();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Unable to create order.");
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      payload.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_slug: item.slug,
        product_name: item.name,
        inspired_by: item.inspiredBy,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
        image: item.image,
      })),
    );

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      method: payload.payment.method,
      status: payload.payment.method === "cod" ? "pending" : "submitted",
      amount: payload.totals.grandTotal,
      sender_number: payload.payment.senderNumber ?? null,
      transaction_id: payload.payment.transactionId ?? null,
    });

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    return NextResponse.json({
      order: mapOrderResponse(order, payload),
      paymentLabel: paymentMethodLabels[payload.payment.method],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to persist order in Supabase.",
      },
      { status: 500 },
    );
  }
}
