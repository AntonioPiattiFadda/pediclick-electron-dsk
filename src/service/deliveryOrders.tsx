import { supabase } from ".";
import { OrderT } from "@/types/orders";
import { Payment } from "@/types/payments";

/**
 * Update delivery order client
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderClient(
  orderId: number,
  clientId: number | null
): Promise<OrderT> {
  const { data, error } = await supabase
    .from("orders")
    .update({ client_id: clientId })
    .eq("order_id", orderId)
    .select("*, client:clients(*)")
    .single();

  if (error) throw error;
  return data as OrderT;
}

/**
 * Update delivery order status
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderStatus(
  orderId: number,
  status: string
): Promise<OrderT> {
  const { data, error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("order_id", orderId)
    .select("*, client:clients(*)")
    .single();

  if (error) throw error;
  return data as OrderT;
}

export async function updateDeliveredOrderStatus(
  orderId: number
): Promise<OrderT> {
  const { data, error } = await supabase.rpc("deliver_order", {
    p_order_id: orderId,
  });

  if (error) throw error;
  return data as OrderT;
}


/**
 * Update delivery order notes
 * Later: Convert to RPC call
 */
export async function updateDeliveryOrderNotes(
  orderId: number,
  notes: string
): Promise<OrderT> {
  const { data, error } = await supabase
    .from("orders")
    .update({ notes })
    .eq("order_id", orderId)
    .select("*, client:clients(*)")
    .single();

  if (error) throw error;
  return data as OrderT;
}

/**
 * Complete delivery order (checkout)
 * Later: Convert to RPC call that handles payments atomically
 */
export async function completeDeliveryOrder(
  orderId: number,
  payments: Payment[]
): Promise<OrderT> {
  // For now: Simple status update
  // Later: RPC will handle payments, status, notifications
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "PAID",
    })
    .eq("order_id", orderId)
    .select("*, client:clients(*)")
    .single();

  if (error) throw error;

  // TODO: Handle payments insert (will move to RPC)
  // For now, just insert payments directly
  if (payments && payments.length > 0) {
    const paymentsToInsert = payments.map((p) => ({
      ...p,
      order_id: orderId,
    }));

    const { error: paymentsError } = await supabase
      .from("payments")
      .insert(paymentsToInsert);

    if (paymentsError) throw paymentsError;
  }

  return data as OrderT;
}
