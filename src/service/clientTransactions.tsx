import { ClientTransaction } from "@/types/clientTransactions";
import { supabase } from ".";

export async function getClientTransactions(clientId: number, page: number, pageSize: number): Promise<ClientTransaction[]> {

    if (clientId === undefined || clientId === null || clientId === 0) {
        return [];
    }
    const { data, error } = await supabase
        .from("client_transactions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);



    if (error) {
        throw new Error(error.message);
    }

    // Ensure number types are correct if backend sends strings
    return data as ClientTransaction[];
}