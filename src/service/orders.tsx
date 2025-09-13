import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const createOrder = async (payload: any, userRole: string) => {
  const businessOwnerId = await getBusinessOwnerIdByRole(userRole);

  console.log("createOrder payload", { ...payload, businessOwnerId });

  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      business_owner_id: businessOwnerId,
      ...payload,
    })
    .select()
    .single();

  console.log("newOrder", newOrder, orderError);

  if (orderError) {
    console.error("orderError", orderError);
    throw new Error("Error al crear la orden");
  }

  return {
    ...newOrder,
  };
};
