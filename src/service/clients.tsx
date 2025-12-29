import { Client } from "@/types/clients";
import { supabase } from ".";
import { getBusinessOwnerId } from "./profiles";

export const getClients = async () => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("business_owner_id", businessOwnerId);

    if (error) {
        throw new Error(error.message);
    }

    return { clients, error };
};

export const getClient = async (clientId: number): Promise<{ client: Client | null, error: Error | null }> => {
    const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("client_id", clientId)
        .single()

    if (error) {
        throw new Error(error.message);
    }

    return { client, error };
};

export const createClient = async (clientData: Partial<Client>) => {
    const businessOwnerId = await getBusinessOwnerId();
    const { data, error } = await supabase
        .from("clients")
        .insert({ ...clientData, business_owner_id: businessOwnerId })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
