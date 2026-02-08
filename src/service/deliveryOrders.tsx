import { supabase } from ".";
import { OrderT } from "@/types/orders";
import { Payment } from "@/types/payments";
import { getOrganizationId } from "./profiles";
import { generateOrderNumber } from "./orders";

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



export async function startEmptyDeliveryOrder(locationId: number, terminalSessionId: number) {
  const organizationId = await getOrganizationId();

  const response = await generateOrderNumber(locationId);
  const orderNumber = response;

  const { data: newOrder, error: error } = await supabase
    .from("orders")
    .insert({
      location_id: locationId,
      organization_id: organizationId,
      terminal_session_id: terminalSessionId,
      order_number: orderNumber,
      payment_status: "PENDING",
      order_type: "DELIVERY",
      order_status: "NEW",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creando la orden de delivery:", error);
    throw error;
  }

  return newOrder;
}

export interface OrderWithMetadata extends OrderT {
  client_full_name?: string;
  item_count: number;
}

export async function getDeliveryOrdersByDateRange(
  locationId: number,
  daysBack: number
): Promise<OrderWithMetadata[]> {
  const organizationId = await getOrganizationId();

  // Calculate the date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysBack);

  // Fetch orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      client:clients(full_name)
    `)
    .eq("order_type", "DELIVERY")
    .eq("location_id", locationId)
    .eq("organization_id", organizationId)
    .gte("created_at", dateThreshold.toISOString())
    .is("deleted_at", null)
    .order("created_at", { ascending: false });


  if (ordersError) {
    console.error("Error fetching delivery orders:", ordersError);
    throw ordersError;
  }

  if (!orders) return [];

  // For each order, fetch order items count
  const ordersWithMetadata: OrderWithMetadata[] = await Promise.all(
    orders.map(async (order) => {
      const { data, error: countError } = await supabase
        .from("order_items")
        .select(`*`)
        .eq("order_id", Number(order.order_id))
      // .is("is_deleted", false);

      console.log(`Count for order ${order.order_id}:`, data, countError);

      if (countError) {
        console.error("Error counting order items:", countError);
      }

      return {
        ...order,
        client_full_name: order.client?.full_name || null,
        item_count: data?.length || 0,
      };
    })
  );

  return ordersWithMetadata;
}
