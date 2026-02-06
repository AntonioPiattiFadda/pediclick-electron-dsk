import { SubapaseConstrains } from "@/types/shared";
import { supabase } from "."
import { getOrganizationId } from "./profiles";
import { handleSupabaseError } from "@/utils/handleSupabaseErrors";
import { TerminalSession } from "@/types/terminalSession";
import { OrderT } from "@/types/orders";
import { Payment } from "@/types/payments";

export const entityConstraints: SubapaseConstrains[] = [{
    value: "one_open_session_per_terminal",
    errorMsg: "Ya existe una sesión abierta para esta terminal."
}
];

export const openTerminalSession = async (locationId: number, userId: string, terminalId: number) => {
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
        .from("terminal_sessions")
        .insert({
            location_id: locationId,
            opened_by_user_id: userId,
            terminal_id: terminalId,
            organization_id: organizationId,
            status: "OPEN",
            opened_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        handleSupabaseError(error, entityConstraints);
    }

    return data;
}

export const closeTerminalSession = async (terminalSessionId: number) => {
    console.log("Closing terminal session with ID:", terminalSessionId);

    const { data, error } = await supabase
        .from("terminal_sessions")
        .update({
            status: "CLOSED",
            closed_at: new Date().toISOString(),
        })
        .eq("terminal_session_id", terminalSessionId)

    if (error) {
        throw error;
    }
    return data;
}

interface OrderWithPayments extends OrderT {
    payments: Payment[];
}


export async function getTerminalSessionClosureData(
    terminalSessionId: number
): Promise<{
    terminalSession: TerminalSession;
    orders: OrderWithPayments[];
    standalonePayments: Payment[];
}> {

    /* -----------------------------
     * 1️⃣ Órdenes + pagos asociados
     * ----------------------------- */
    const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`*,
      payments (
        payment_id,
        amount,
        payment_method,
        payment_direction,
        created_at
      )
    `)
        .eq("terminal_session_id", terminalSessionId)
        .is("deleted_at", null);

    if (ordersError) throw ordersError;

    /* -----------------------------
     * 2️⃣ Pagos sin orden asociada
     * ----------------------------- */
    const { data: standalonePayments, error: paymentsError } =
        await supabase
            .from("payments")
            .select(`*`)
            .eq("terminal_session_id", terminalSessionId)
            .is("order_id", null)

    if (paymentsError) throw paymentsError;

    const { data: terminalSession, error: terminalSessionError } =
        await supabase
            .from("terminal_sessions")
            .select(`*`)
            .eq("terminal_session_id", terminalSessionId)
            .single();

    if (terminalSessionError) throw terminalSessionError;

    return {
        terminalSession,
        orders,
        standalonePayments,
    };
}
