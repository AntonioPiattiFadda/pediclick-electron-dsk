import { signOut } from "@/service/auth";
import { useTerminalSessionData } from "./useTerminalSessionData";
import { closeTerminalSession } from "@/service/terminalSessions";
import { useTerminalData } from "./useTerminalData";
import { useGetLocationData } from "./useGetLocationData";

export const useLogOut = () => {
    const { handleRemoveLocation } = useGetLocationData();
    const { handleRemoveTerminal } = useTerminalData();
    const { handleRemoveTerminalSession, handleGetTerminalSessionId } = useTerminalSessionData();

    const handleLogOut = async () => {

        try {
            const terminalSessionId = handleGetTerminalSessionId();
            console.log("Terminal Session ID to close:", terminalSessionId);
            const response = await closeTerminalSession(terminalSessionId);
            console.log("Terminal session closed:", response);

            handleRemoveLocation();
            handleRemoveTerminal();
            handleRemoveTerminalSession();

            await signOut();
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }


    return { handleLogOut };
}