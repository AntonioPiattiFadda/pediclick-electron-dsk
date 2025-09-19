import { supabase } from ".";
import { getBusinessOwnerIdByRole } from "./profiles";

export const getClients = async (userRole: string) => {
    const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
    const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("business_owner_id", businessOwnerId);

    if (error) {
        throw new Error(error.message);
    }

    return { clients, error };
};

export const createClient = async (name: string, userRole: string) => {
    const businessOwnerId = await getBusinessOwnerIdByRole(userRole);
    const { data, error } = await supabase
        .from("clients")
        .insert({ full_name: name, business_owner_id: businessOwnerId })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
