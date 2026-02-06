import { NotificationsType } from "@/types/notifications";
import { OrderItem } from "@/types/orderItems";
import { Payment } from "@/types/payments";
import { OrderT } from "@/types/orders";
import { getUserId, supabase } from ".";
import { getOrganizationId } from "./profiles";

export async function createOrder(order: OrderT, orderItems: OrderItem[], payments: Omit<Payment, 'payment_id' | 'created_at' | 'selected'>[]) {

  const organizationId = await getOrganizationId();
  console.log("Creating order with:", { order, orderItems, payments });

  // FIXME comente el is_:deleted esta bien= o se usa en la funcion de supabase
  const adaptedOrderItems: Omit<OrderItem, 'product_name' | 'product_presentation_name'>[] = orderItems.map((it) => ({
    order_id: it.order_id,
    product_id: it.product_id,
    price: it.price,
    quantity: it.quantity,
    over_sell_quantity: it.over_sell_quantity,
    subtotal: it.subtotal,
    discount: it.discount,
    tax: it.tax,
    total: it.total,
    product_presentation_id: it.product_presentation_id,
    lot_id: it.lot_id,
    stock_id: it.stock_id,
    price_type: it.price_type,
    logic_type: it.logic_type,
    created_at: it.created_at,
    status: it.status,
    location_id: it.location_id,
    is_deleted: it.is_deleted,
  }));

  console.log("Adapted order items:", adaptedOrderItems);

  const subtotalSum = orderItems.reduce((s, it) => s + (it.subtotal || 0), 0);
  const discountSum = orderItems.reduce((s, it) => s + (it.discount || 0), 0);
  const taxSum = orderItems.reduce((s, it) => s + (it.tax || 0), 0);
  const totalSum = orderItems.reduce((s, it) => s + (it.total || 0), 0);

  //FIXME no se esta calculando bien el total_price, el sold quantity para restar el stock. El stock sold no tiene productId ni store id,
  //FIXME La client transaction tampoco se esta actualizando bien
  const adaptedOrder: OrderT = {
    ...order,
    organization_id: organizationId,
    payment_status: payments.length === 0 ? "PENDING" : "PAID",
    order_status: order.order_status,
    subtotal: subtotalSum,
    discount: discountSum,
    tax: taxSum,
    total_amount: totalSum,

  };

  console.log("Adapted order:", adaptedOrder);

  const filteredpayments = payments.filter((it) => it.amount && it.amount > 0).map((it) => ({
    ...it,
    payment_direction: "IN",
    payment_type: "ORDER",
  }));



  const { data, error } = await supabase.rpc("register_order", {
    p_order: adaptedOrder,
    p_order_items: adaptedOrderItems,
    p_order_payments: filteredpayments,
  });
  console.log("data, error:", data, error);


  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function cancelOrder(order: OrderT, orderItems: OrderItem[]) {

  const organizationId = await getOrganizationId();

  const userId = await getUserId();

  const notification: NotificationsType = {
    organization_id: organizationId,
    title: "Orden cancelada",
    message: `La orden ${order.order_number} ha sido cancelada.`,
    status: 'PENDING',
    order_id: order.order_id,
    location_id: order.location_id,
    canceled_by: userId || '',
  };

  const { error: notificationsError } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  if (notificationsError) throw notificationsError;

  console.log("Cancelling order with:", { order, orderItems, notification });

  const adaptedOrder = { ...order, organization_id: organizationId, order_status: "CANCELLED" };
  delete adaptedOrder.client;

  const { error: orderError } = await supabase
    .from("orders")
    .update(adaptedOrder)
    .eq("order_id", order.order_id)
    .select()
    .single();

  if (orderError) throw orderError;

  const adaptedOrderItems: Omit<OrderItem, 'product_name' | 'product_presentation_name'>[] = orderItems.map((it) => ({
    order_id: it.order_id,
    product_id: it.product_id,
    price: it.price,
    quantity: it.quantity,
    over_sell_quantity: it.over_sell_quantity,
    subtotal: it.subtotal,
    discount: it.discount,
    tax: it.tax,
    total: it.total,
    product_presentation_id: it.product_presentation_id,
    stock_id: it.stock_id,
    price_type: it.price_type,
    logic_type: it.logic_type,
    created_at: it.created_at,
    status: it.status,
    location_id: it.location_id,
    lot_id: it.lot_id,
    is_deleted: it.is_deleted,
  }));

  console.log("Adapted order items:", adaptedOrderItems);
  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(adaptedOrderItems) // 👈 ARRAY → insert múltiple
    .select();

  if (orderItemsError) throw orderItemsError;

  //FIXME no se esta calculando bien el total_price, el sold quantity para restar el stock. El stock sold no tiene productId ni store id,
  //FIXME La client transaction tampoco se esta actualizando bien

  // const { data, error } = await supabase
  //   .rpc("cancel_order", {
  //     p_order: adaptedOrder,
  //     p_order_items: adaptedOrderItems,
  //     p_notification: notification,
  //   });

  // console.log("data, error:", data, error);

  // if (error) {
  //   throw error;
  // }

  // console.log("Orden creada con ID:", data);
  // return data;

  return order.order_id;
}

export async function generateOrderNumber(locationId: number) {
  // 1) Buscar secuencia existente
  const { data: seq, error: fetchError } = await supabase
    .from("store_order_sequences")
    .select("*")
    .eq("location_id", locationId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    // Si el error NO es "no rows", lo tiramos
    throw fetchError;
  }

  let nextNumber = 1;
  // 2) Si existe → incrementamos en JS
  if (seq) {
    nextNumber = seq.last_number + 1;
    // 3) Upsert con el valor nuevo
    const { error: upsertError } = await supabase
      .from("store_order_sequences")
      .update({
        location_id: locationId,
        last_number: nextNumber,
      })
      .eq("location_id", locationId)
      .select()
      .single();

    if (upsertError) throw upsertError;
  } else {// 3) Si no existe → insert con valor 1
    const { error: insertError } = await supabase
      .from("store_order_sequences")
      .insert({
        location_id: locationId,
        last_number: nextNumber,
      });
    if (insertError) throw insertError;


  }
  // 4) Devolver número correlativo
  return nextNumber;
}

export async function startEmptyOrder(locationId: number, terminalSessionId: number) {
  const organizationId = await getOrganizationId();


  const response = await generateOrderNumber(locationId);

  const orderNumber = response

  const { data: newOrder, error: error } = await supabase
    .from("orders")
    .insert({
      location_id: locationId,
      organization_id: organizationId,
      terminal_session_id: terminalSessionId,
      order_number: orderNumber,
      payment_status: "PENDING",
      order_type: "DIRECT_SALE",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creando la orden:", error);
    throw error;
  }

  return newOrder;
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
  client_name?: string;
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
      client:clients(client_name)
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
      const { count, error: countError } = await supabase
        .from("order_items")
        .select("*", { count: "exact", head: true })
        .eq("order_id", order.order_id)
        .is("is_deleted", false);

      if (countError) {
        console.error("Error counting order items:", countError);
      }

      return {
        ...order,
        client_name: order.client?.client_name || null,
        item_count: count || 0,
      };
    })
  );

  return ordersWithMetadata;
}
