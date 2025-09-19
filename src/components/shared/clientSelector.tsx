/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppSelector } from "@/hooks/useUserData";
import { createClient, getClients } from "@/service/clients";
import type { Client } from "@/types/clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ClientHistoricalMvts from "../unassigned/clientHistoricalMvts";


interface ClientSelectProps {
    value: number | null;
    onChange: (id: number | null) => void;
    disabled: boolean;
}

export function ClientSelector({
    value,
    onChange,
    disabled,
}: ClientSelectProps) {
    const queryClient = useQueryClient();

    const { data: clients, isLoading: isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getClients(role);
            return response.clients;
        },
    });

    console.log("Clients loaded:", clients);

    const [newClient, setNewClient] = useState("");
    const [open, setOpen] = useState(false);

    const { role } = useAppSelector((state) => state.user);

    const createClientMutation = useMutation({
        mutationFn: async (data: { newClient: string }) => {
            return await createClient(data.newClient, role);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            onChange(data.client_id);
            setOpen(false);
        },
        onError: (error: any) => {
            const errorMessage = error.message;
            toast("Error al crear cliente", {
                description: errorMessage,
            });
        },
    });

    const handleCreateClient = async () => {
        if (!newClient) return;

        try {
            await createClientMutation.mutateAsync({ newClient });
            setNewClient("");
        } catch (error) {
            console.error("Error creating client:", error);
        }
    };

    if (isLoading) {
        return <Input placeholder="Buscando tus clientes..." disabled />;
    }

    const selectedClient = clients?.find((c) => c.client_id === value);

    return (
        <>
            <div className="flex items-center gap-2 w-full">
                <select
                    className="w-full border rounded px-2 py-2"
                    disabled={disabled}
                    value={value === null ? "" : value}
                    onChange={(e) =>
                        onChange(e.target.value === "" ? 0 : Number(e.target.value))
                    }
                >
                    <option value={0}>Sin Cliente</option>
                    {(clients ?? []).map((client: Client) => (
                        <option key={client.client_id} value={client.client_id}>
                            {client.full_name}
                        </option>
                    ))}
                </select>

                {/* Si hay selección, mostrar tacho */}
                {value && (
                    <Button
                        variant="ghost"
                        disabled={disabled}
                        size="icon"
                        onClick={() => onChange(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <Trash2 className="w-5 h-5" />
                    </Button>
                )}

                {/* Botón para crear nuevo cliente */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={disabled} variant="outline">
                            + Nuevo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Crear nuevo cliente</DialogTitle>
                            <DialogDescription>
                                Ingresá el nombre del nuevo cliente que quieras crear.
                            </DialogDescription>
                        </DialogHeader>

                        <Input
                            value={newClient}
                            disabled={createClientMutation.isPending}
                            onChange={(e) => setNewClient(e.target.value)}
                            placeholder="Nombre del cliente"
                        />

                        <DialogFooter>
                            <Button
                                disabled={createClientMutation.isPending}
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                disabled={createClientMutation.isPending}
                                onClick={handleCreateClient}
                            >
                                {createClientMutation.isPending ? "Creando..." : "Crear"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex flex-col items-center gap-2 w-full">
                {value && (
                    <>
                        <p className="">
                            {selectedClient?.has_credit
                                ? `Límite de crédito: $${selectedClient.credit_limit} | Saldo actual: $${selectedClient.current_balance}`
                                : "Sin crédito asignado"}
                        </p>

                        <p className="">
                            {selectedClient?.current_balance}
                        </p>
                        <ClientHistoricalMvts selectedClientId={selectedClient?.client_id} />


                    </>
                )}
            </div>


        </>
    );
}
