import { Payment } from "@/types/payments";
import { supabase } from ".";

export async function registerClientPayment(payments: Partial<Payment>[], clientId: number) {

    //FIXME no se esta calculando bien el total_price, el sold quantity para restar el stock. El stock sold no tiene productId ni store id,
    //FIXME La client transaction tampoco se esta actualizando bien


    const filteredpayments = payments.filter((it) => it.amount && it.amount > 0)

    console.log("filteredpayments:", filteredpayments);
    console.log("clientId:", clientId);


    if (!clientId) {
        throw new Error("Debes seleccionar un cliente para registrar el pago.");
    }


    const { data, error } = await supabase.rpc("register_client_payments", {
        p_client_id: clientId,
        p_payments: filteredpayments,
    });

    console.log("data, error:", data, error);


    if (error) {
        throw error;
    }

    return data;
}