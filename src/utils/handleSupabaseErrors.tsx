// utils/handleSupabaseError.ts

import type { SubapaseConstrains } from "@/types/shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleSupabaseError(error: any, constraints: SubapaseConstrains[]): never {

    let userMessage = error.message || "Ocurrió un error inesperado.";

    for (const constraint of constraints) {
        if (error.message?.includes(constraint.value)) {
            userMessage = constraint.errorMsg;
            break;
        }
    }

    throw new Error(userMessage);
}
