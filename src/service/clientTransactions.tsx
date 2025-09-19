import { supabase } from ".";
import type { ClientTransaction } from "@/types/clientTransactions";

export async function getClientTransactions(clientId: string | number): Promise<ClientTransaction[]> {

    if (clientId === undefined || clientId === null || clientId === 0 || clientId === "0") {
        return [];
    }
    const { data, error } = await supabase
        .from("client_transactions")
        .select("*")
        .eq("client_id", clientId);

    if (error) {
        throw new Error(error.message);
    }

    // Ensure number types are correct if backend sends strings
    return data as ClientTransaction[];
}