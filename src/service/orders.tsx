import { OrderItem } from "@/types/orderItems";
import { OrderPayment } from "@/types/orderPayments";
import { Order } from "@/types/orders";
import { supabase } from ".";

export async function createOrder(order: Order, orderItems: OrderItem[], orderPayments: OrderPayment[]) {
  const { data, error } = await supabase.rpc("register_order", {
    p_order: order,
    p_order_items: orderItems,
    p_order_payments: orderPayments,
  });

  if (error) {
    console.error("Error creando la orden:", error);
    throw error;
  }

  console.log("Orden creada con ID:", data);
  return data;
}
