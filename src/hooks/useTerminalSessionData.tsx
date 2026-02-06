import { TerminalSession } from "@/types/terminalSession";

export const useTerminalSessionData = () => {

    const handleSetTerminalSession = (terminalData: TerminalSession) => {
        localStorage.setItem("selectedTerminalSession", JSON.stringify({
            ...terminalData
        }));
    }

    const handleGetTerminalSession = () => {
        const storedTerminalSession = localStorage.getItem("selectedTerminalSession")
        return storedTerminalSession ? JSON.parse(storedTerminalSession) : null;
    }

    const handleGetTerminalSessionId = () => {
        const terminalSession = handleGetTerminalSession();
        return terminalSession ? terminalSession.terminal_session_id : null;
    }

    const handleRemoveTerminalSession = () => {
        localStorage.removeItem("selectedTerminalSession");
    }

    return { handleGetTerminalSession, handleSetTerminalSession, handleGetTerminalSessionId, handleRemoveTerminalSession };
}