import { SelectTerminal, TerminalSelectorRoot } from "@/components/shared/selectors/TerminalSelector"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useGetLocationData } from "@/hooks/useGetLocationData"
import { useTerminalData } from "@/hooks/useTerminalData"
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData"
import { getUserId } from "@/service"
import { openTerminalSession } from "@/service/terminalSessions"
import { Terminal } from "@/types/terminals"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const SelectTerminalPage = () => {
    const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null)
    const navigate = useNavigate()

    const { handleSetTerminal } = useTerminalData();
    const { handleSetTerminalSession } = useTerminalSessionData();
    const { handleGetLocationId } = useGetLocationData();

    const openTerminalSessionMutation = useMutation({
        mutationFn: async () => {
            const userId = await getUserId();
            if (!selectedTerminal?.terminal_id) {
                toast.error("Selecciona una Terminal")
                return
            }
            if (!userId) {
                toast.error("Tenemos un problema para identificarte, por favor inicia sesión de nuevo.")
                return
            }

            const locationId = await handleGetLocationId();

            return await openTerminalSession(locationId, userId, selectedTerminal.terminal_id);
        },
        onSuccess: (data) => {
            console.log("Terminal session opened:", data);
            handleSetTerminal(selectedTerminal!)
            handleSetTerminalSession(data);
            navigate("/in-site-orders")
        },
        onError: (error) => {
            console.log(error)
            toast(error.message, { icon: "⚠️" });
        },
    });

    return (
        <div className="w-screen h-[80vh] flex items-center justify-center ">
            <div className="flex flex-col gap-4 w-lg">
                <Label>Selecciona una Terminal</Label>
                <TerminalSelectorRoot
                    value={selectedTerminal}
                    onChange={setSelectedTerminal}>
                    <SelectTerminal />
                </TerminalSelectorRoot>

                <Button
                    disabled={selectedTerminal === null || openTerminalSessionMutation.isPending}
                    onClick={() => {
                        openTerminalSessionMutation.mutate();
                    }}
                >
                    {openTerminalSessionMutation.isPending ? "Abriendo sesión..." : "Seleccionar Terminal"}

                </Button>

            </div>
        </div>
    )
}

export default SelectTerminalPage