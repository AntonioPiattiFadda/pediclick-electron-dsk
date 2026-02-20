import { MoneyInput } from "@/components/shared/MoneyInput";
import { LocationSelectorRoot, SelectLocation } from "@/components/shared/selectors/locationSelector";
import { SelectTerminal, TerminalSelectorRoot } from "@/components/shared/selectors/TerminalSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { useTerminalData } from "@/hooks/useTerminalData";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";
import { getUserId } from "@/service";
import { closeTerminalSession, getOpenSessionByTerminalId, openTerminalSession } from "@/service/terminalSessions";
import { Location } from "@/types/locations";
import { Terminal } from "@/types/terminals";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type BlockedSession = {
    terminal_session_id: number;
    opened_at: string;
    users: { full_name: string; email: string } | null;
};

const SetupSession = () => {
    const navigate = useNavigate();

    const { handleGetLocation, handleSetLocation } = useGetLocationData();
    const { handleGetTerminal, handleSetTerminal } = useTerminalData();
    const { handleSetTerminalSession } = useTerminalSessionData();

    const savedLocation: Location | null = handleGetLocation();
    const savedTerminal: Terminal | null = handleGetTerminal();
    const hasQuickMode = savedLocation !== null && savedTerminal !== null;

    const [mode, setMode] = useState<"quick" | "manual">(hasQuickMode ? "quick" : "manual");
    const [selectedStore, setSelectedStore] = useState<Location | null>(hasQuickMode ? savedLocation : null);
    const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(hasQuickMode ? savedTerminal : null);
    const [openingBalance, setOpeningBalance] = useState("");
    const [blockedSession, setBlockedSession] = useState<BlockedSession | null>(null);

    const switchToManual = () => {
        setMode("manual");
        setSelectedStore(null);
        setSelectedTerminal(null);
    };

    const openSessionMutation = useMutation({
        mutationFn: async () => {
            if (!selectedStore || !selectedTerminal) throw new Error("Selecciona una tienda y una terminal");

            const userId = await getUserId();
            if (!userId) throw new Error("No se pudo identificar al usuario");

            const openSession = await getOpenSessionByTerminalId(selectedTerminal.terminal_id);
            if (openSession) {
                setBlockedSession(openSession as BlockedSession);
                return null;
            }

            const balance = parseFloat(openingBalance) || 0;
            return await openTerminalSession(selectedStore.location_id!, userId, selectedTerminal.terminal_id, balance);
        },
        onSuccess: (data) => {
            if (!data) return;
            handleSetLocation(selectedStore!);
            handleSetTerminal(selectedTerminal!);
            handleSetTerminalSession(data);
            navigate("/in-site-orders");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const forceCloseAndOpenMutation = useMutation({
        mutationFn: async () => {
            if (!blockedSession || !selectedStore || !selectedTerminal) throw new Error("Error inesperado");

            const userId = await getUserId();
            if (!userId) throw new Error("No se pudo identificar al usuario");

            await closeTerminalSession(blockedSession.terminal_session_id, { forced: true });

            const balance = parseFloat(openingBalance) || 0;
            return await openTerminalSession(selectedStore.location_id!, userId, selectedTerminal.terminal_id, balance);
        },
        onSuccess: (data) => {
            handleSetLocation(selectedStore!);
            handleSetTerminal(selectedTerminal!);
            handleSetTerminalSession(data);
            navigate("/in-site-orders");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    if (blockedSession) {
        const openedAt = new Date(blockedSession.opened_at).toLocaleString();
        const openedBy = blockedSession.users?.full_name || blockedSession.users?.email || "Usuario desconocido";

        return (
            <div className="w-screen flex items-center justify-center mt-[20vh]">
                <div className="flex flex-col gap-4 w-full max-w-md">
                    <div className="flex items-start gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-yellow-800">
                                Esta terminal tiene una sesión abierta
                            </p>
                            <p className="text-sm text-yellow-700">
                                Abierta por <strong>{openedBy}</strong> el {openedAt}
                            </p>
                            <p className="text-xs text-yellow-600 mt-1">
                                Esta acción quedará registrada.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="destructive"
                        onClick={() => forceCloseAndOpenMutation.mutate()}
                        disabled={forceCloseAndOpenMutation.isPending}
                    >
                        {forceCloseAndOpenMutation.isPending
                            ? "Cerrando sesión anterior..."
                            : "Cerrar sesión anterior y continuar"}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setBlockedSession(null)}
                        disabled={forceCloseAndOpenMutation.isPending}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen flex items-center justify-center mt-[20vh]">
            <div className="flex flex-col gap-6 w-full max-w-md">

                {mode === "quick" && savedLocation && savedTerminal ? (
                    <>
                        <div>
                            <h2 className="text-lg font-semibold">Bienvenido de vuelta</h2>
                            <p className="text-sm text-muted-foreground mt-1">Última ubicación guardada</p>
                        </div>

                        <div className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/50">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Punto de venta</span>
                                <span className="font-medium">{savedLocation.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Terminal</span>
                                <span className="font-medium">{savedTerminal.name}</span>
                            </div>
                        </div>

                        <button
                            className="text-sm text-muted-foreground underline text-left hover:text-foreground w-fit"
                            onClick={switchToManual}
                        >
                            Cambiar ubicación
                        </button>
                    </>
                ) : (
                    <>
                        <div>
                            <h2 className="text-lg font-semibold">Configurar sesión</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Selecciona tu punto de venta y terminal
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Punto de venta</Label>
                                <LocationSelectorRoot filter="STORES" value={selectedStore} onChange={setSelectedStore}>
                                    <SelectLocation />
                                </LocationSelectorRoot>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Terminal</Label>
                                <TerminalSelectorRoot value={selectedTerminal} onChange={setSelectedTerminal}>
                                    <SelectTerminal />
                                </TerminalSelectorRoot>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex flex-col gap-2">
                    <MoneyInput
                        label='Efectivo inicial en caja'
                        value={Number(openingBalance)}
                        placeholder="0.00"
                        disabled={false}
                        onChange={(value) => setOpeningBalance(value)}
                        id="opening-balance"
                    />
                </div>

                <Button
                    disabled={!selectedStore || !selectedTerminal || openSessionMutation.isPending}
                    onClick={() => openSessionMutation.mutate()}
                >
                    {openSessionMutation.isPending ? "Verificando..." : "Abrir sesión"}
                </Button>
            </div>
        </div>
    );
};

export default SetupSession;
