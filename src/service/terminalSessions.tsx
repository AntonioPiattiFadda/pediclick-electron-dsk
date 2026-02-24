import { SubapaseConstrains } from "@/types/shared";
import { supabase } from "."
import { getOrganizationId } from "./profiles";
import { handleSupabaseError } from "@/utils/handleSupabaseErrors";
import { OpenSessionDisplay, TerminalSession } from "@/types/terminalSession";
import { OrderT } from "@/types/orders";
import { Payment } from "@/types/payments";
import { User } from "@supabase/supabase-js";

export const entityConstraints: SubapaseConstrains[] = [{
    value: "one_open_session_per_terminal",
    errorMsg: "Ya existe una sesión abierta para esta terminal."
}
];

export const openTerminalSession = async (locationId: number, userId: string, terminalId: number, openingBalance: number = 0) => {
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
            opening_balance: openingBalance,
        })
        .select()
        .single();

    if (error) {
        handleSupabaseError(error, entityConstraints);
    }

    return data;
}

export const getOpenSessionByTerminalId = async (terminalId: number) => {
    const { data, error } = await supabase
        .from("terminal_sessions")
        .select(`*, users(full_name, email)`)
        .eq("terminal_id", terminalId)
        .eq("status", "OPEN")
        .maybeSingle();

    if (error) throw error;
    return data;
}

export const closeTerminalSession = async (terminalSessionId: number, options?: { forced?: boolean }) => {
    console.log("Closing terminal session with ID:", terminalSessionId);

    const { data, error } = await supabase
        .from("terminal_sessions")
        .update({
            status: options?.forced ? "FORCE_CLOSED" : "CLOSED",
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
    user: User;
    orders: OrderWithPayments[];
    payments: Payment[];
}> {

    /* -----------------------------
     * 1️⃣ Órdenes + pagos asociados
     * ----------------------------- */
    const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`order_id,
      payments (
        amount,
        payment_method,
        payment_direction
      )
    `)
        .eq("terminal_session_id", terminalSessionId)
        .eq("order_type", "DIRECT_SALE")
        .is("deleted_at", null);

    if (ordersError) throw ordersError;

    /* -----------------------------
     * 2️⃣ Pagos sin orden asociada
     * ----------------------------- */
    const { data: standalonePayments, error: paymentsError } =
        await supabase
            .from("payments")
            .select("amount, payment_method, payment_direction, payment_type")
            .eq("terminal_session_id", terminalSessionId)
            .is("order_id", null)

    if (paymentsError) throw paymentsError;

    const { data: terminalSession, error: terminalSessionError } =
        await supabase
            .from("terminal_sessions")
            .select("terminal_session_id, opening_balance, opened_at, users(email)")
            .eq("terminal_session_id", terminalSessionId)
            .single();

    if (terminalSessionError) throw terminalSessionError;

    const terminalSessionUser = terminalSession.users as User;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const terminalSessionWithNoUser = terminalSession as any;
    delete terminalSessionWithNoUser.users;

    return {
        terminalSession: terminalSessionWithNoUser as TerminalSession,
        user: terminalSessionUser,
        orders,
        payments: standalonePayments,
    };
}
export async function getOpenTerminalSessions(organizationId: string): Promise<OpenSessionDisplay[]> {
    const { data, error } = await supabase
        .from("terminal_sessions")
        .select(`terminal_session_id, opened_by_user_id, opened_at,
            terminals (name),
            users (full_name, email)
        `)
        .eq("status", "OPEN")
        .eq("organization_id", organizationId);

    console.log("Fetched open terminal sessions:", data, "with error:", error);

    if (error) throw error;

    const adaptedData: OpenSessionDisplay[] = data.map((session) => ({
        terminal_session_id: session.terminal_session_id,
        opened_by_user_id: session.opened_by_user_id,
        opened_at: session.opened_at,
        opened_by_user_name: session.users.full_name || session.users.email, // Assuming users is the correct relation name
    }));

    // Transform the data to match OpenSessionDisplay interface
    return adaptedData;
}

export async function closeTerminalSessionDev(terminalSessionId: number) {
    const { data, error } = await supabase
        .from("terminal_sessions")
        .update({
            status: "CLOSED",
            closed_at: new Date().toISOString(),
        })
        .eq("terminal_session_id", terminalSessionId);

    if (error) throw error;
    return data;
}
