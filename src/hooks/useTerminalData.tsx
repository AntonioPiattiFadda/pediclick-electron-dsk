import { Terminal } from "@/types/terminals";

export const useTerminalData = () => {

    const handleSetTerminal = (terminalData: Terminal) => {
        localStorage.setItem("selectedTerminal", JSON.stringify({
            ...terminalData
        }));
    }

    const handleGetTerminal = () => {
        const storedTerminal = localStorage.getItem("selectedTerminal")
        return storedTerminal ? JSON.parse(storedTerminal) : null;
    }

    const handleGetTerminalId = () => {
        const terminal = handleGetTerminal();
        return terminal ? terminal.terminal_id : null;
    }

    const handleRemoveTerminal = () => {
        localStorage.removeItem("selectedTerminal");
    }

    return { handleGetTerminal, handleSetTerminal, handleGetTerminalId, handleRemoveTerminal };
}