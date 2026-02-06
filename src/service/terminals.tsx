import { Terminal } from "@/types/terminals";
import { supabase } from ".";
import { getOrganizationId } from "./profiles";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const createTerminal = async (formData: any) => {
    const organizationId = await getOrganizationId();

    const formattedTerminal = {
        ...formData,
        organization_id: organizationId,
    };

    const { data, error } = await supabase
        .from("terminals")
        .insert(formattedTerminal)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { data };
};

export const getTerminals = async () => {
    const organizationId = await getOrganizationId();

    const { data: terminals, error } = await supabase
        .from("terminals")
        .select("*")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return { terminals };
};

export const editTerminal = async (
    terminalId: string | number,
    formData: Partial<Terminal>
) => {
    const { data, error } = await supabase
        .from("terminals")
        .update(formData)
        .eq("terminal_id", Number(terminalId))
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { data };
};

export const deleteTerminal = async (terminalId: string | number) => {
    const { data, error } = await supabase
        .from("terminals")
        .update({ deleted_at: new Date() })
        .eq("terminal_id", Number(terminalId))
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { data };
};
