import { Client } from "@/types/clients";
import { supabase } from ".";
import { getOrganizationId } from "./profiles";

export const getClients = async () => {
    const organizationId = await getOrganizationId();
    const { data: clients, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organizationId);

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
    const organizationId = await getOrganizationId();
    const { data, error } = await supabase
        .from("clients")
        .insert({ ...clientData, organization_id: organizationId })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
