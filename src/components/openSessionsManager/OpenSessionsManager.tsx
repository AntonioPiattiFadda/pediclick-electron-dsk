import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizationId } from "@/service/profiles";
import { getOpenTerminalSessions, closeTerminalSessionDev } from "@/service/terminalSessions";
import { OpenSessionDisplay } from "@/types/terminalSession";
import { useToast } from "@/hooks/use-toast";

interface OpenSessionsManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const OpenSessionsManager = ({ open, onOpenChange }: OpenSessionsManagerProps) => {
    const [sessionToClose, setSessionToClose] = useState<OpenSessionDisplay | null>(null);
    const [showCloseAllConfirm, setShowCloseAllConfirm] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch open sessions
    const { data: sessions, isLoading, isError } = useQuery({
        queryKey: ["openTerminalSessions"],
        queryFn: async () => {
            const organizationId = await getOrganizationId();
            return getOpenTerminalSessions(organizationId);
        },
        enabled: open,
    });

    // Close individual session mutation
    const closeMutation = useMutation({
        mutationFn: closeTerminalSessionDev,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["openTerminalSessions"] });
            toast({
                title: "Sesión cerrada",
                description: "La sesión se cerró exitosamente.",
            });
            setSessionToClose(null);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "No se pudo cerrar la sesión. Intente nuevamente.",
                variant: "destructive",
            });
            console.error("Error closing session:", error);
        },
    });

    // Close all sessions mutation
    const closeAllMutation = useMutation({
        mutationFn: async (sessionIds: number[]) => {
            await Promise.all(sessionIds.map(id => closeTerminalSessionDev(id)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["openTerminalSessions"] });
            toast({
                title: "Sesiones cerradas",
                description: "Todas las sesiones se cerraron exitosamente.",
            });
            setShowCloseAllConfirm(false);
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "No se pudieron cerrar todas las sesiones. Intente nuevamente.",
                variant: "destructive",
            });
            console.error("Error closing all sessions:", error);
        },
    });

    const handleCloseSession = (session: OpenSessionDisplay) => {
        setSessionToClose(session);
    };

    const confirmCloseSession = () => {
        if (sessionToClose) {
            closeMutation.mutate(sessionToClose.terminal_session_id);
        }
    };

    const handleCloseAll = () => {
        setShowCloseAllConfirm(true);
    };

    const confirmCloseAll = () => {
        if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map(s => s.terminal_session_id);
            closeAllMutation.mutate(sessionIds);
        }
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Sesiones de Terminal Abiertas</DialogTitle>
                    </DialogHeader>

                    <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-[200px]">
                                <Spinner />
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col justify-center items-center h-[200px] text-center">
                                <p className="text-destructive mb-4">Error al cargar las sesiones.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ["openTerminalSessions"] })}
                                >
                                    Reintentar
                                </Button>
                            </div>
                        ) : !sessions || sessions.length === 0 ? (
                            <div className="flex justify-center items-center h-[200px] text-muted-foreground">
                                No hay sesiones abiertas
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <div
                                        key={session.terminal_session_id}
                                        className="flex justify-between items-start p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{session.terminal_name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Usuario: {session.user_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Abierta: {formatDateTime(session.opened_at)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCloseSession(session)}
                                            disabled={closeMutation.isPending || closeAllMutation.isPending}
                                        >
                                            Cerrar
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={closeMutation.isPending || closeAllMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        {sessions && sessions.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleCloseAll}
                                disabled={closeMutation.isPending || closeAllMutation.isPending}
                            >
                                {closeAllMutation.isPending ? "Cerrando..." : "Cerrar Todas"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Individual Close Confirmation */}
            <AlertDialog open={!!sessionToClose} onOpenChange={(open) => !open && setSessionToClose(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar sesión de terminal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de cerrar la sesión de {sessionToClose?.terminal_name}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={closeMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCloseSession}
                            disabled={closeMutation.isPending}
                        >
                            {closeMutation.isPending ? "Cerrando..." : "Cerrar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Close All Confirmation */}
            <AlertDialog open={showCloseAllConfirm} onOpenChange={setShowCloseAllConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar todas las sesiones?</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de cerrar todas las {sessions?.length} sesiones abiertas?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={closeAllMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCloseAll}
                            disabled={closeAllMutation.isPending}
                        >
                            {closeAllMutation.isPending ? "Cerrando..." : "Cerrar Todas"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default OpenSessionsManager;
