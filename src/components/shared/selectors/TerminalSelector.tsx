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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import {
    createContext,
    useContext,
    type ReactNode,
    useState,
} from "react";
import toast from "react-hot-toast";

import type { Terminal } from "@/types/terminals";
import { Label } from "@/components/ui/label";
import { createTerminal, getTerminals } from "@/service/terminals";


// ─────────────────────────────
// Context
// ─────────────────────────────

interface TerminalSelectorContextType {
    value: Terminal | null;
    onChange: (terminal: Terminal | null) => void;
    disabled: boolean;
    terminals: Terminal[];
    isLoading: boolean;
    omitId?: number | null;
}

const TerminalSelectorContext =
    createContext<TerminalSelectorContextType | null>(null);

function useTerminalSelectorContext() {
    const ctx = useContext(TerminalSelectorContext);
    if (!ctx)
        throw new Error("TerminalSelector components must be used inside Root");
    return ctx;
}


// ─────────────────────────────
// Root
// ─────────────────────────────

interface RootProps {
    value: Terminal | null;
    onChange: (terminal: Terminal | null) => void;
    disabled?: boolean;
    children: ReactNode;
    omitId?: number | null;
}

const TerminalSelectorRoot = ({
    value,
    onChange,
    disabled = false,
    children,
    omitId,
}: RootProps) => {

    const { data: terminals, isLoading, isError } = useQuery({
        queryKey: ["terminals"],
        queryFn: async () => {
            const response = await getTerminals();
            return response.terminals;
        },
    });

    if (isError) {
        return <div>Error loading terminals.</div>;
    }

    return (
        <TerminalSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                terminals: terminals ?? [],
                isLoading,
                omitId,
            }}
        >
            <div className="flex items-center gap-2 w-full h-10">
                {children}
            </div>
        </TerminalSelectorContext.Provider>
    );
};


// ─────────────────────────────
// Select
// ─────────────────────────────

const SelectTerminal = ({ children }: { children?: ReactNode }) => {

    const { value, onChange, disabled, terminals, isLoading, omitId } =
        useTerminalSelectorContext();

    if (isLoading) {
        return (
            <Input className="h-10" placeholder="Cargando cajas..." disabled />
        );
    }

    return (
        <>
            <Select
                disabled={disabled}
                value={value?.terminal_id?.toString() ?? ""}
                onValueChange={(val) => {
                    const selected = terminals.find(
                        t => t.terminal_id?.toString() === val
                    );
                    onChange(selected ?? null);
                }}
            >
                <SelectTrigger className="h-11 w-full border-gray-200">
                    <SelectValue placeholder="Seleccionar caja" />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Cajas</SelectLabel>
                        {terminals
                            .filter(t => t.terminal_id !== omitId)
                            .map((t) => (
                                <SelectItem
                                    key={t.terminal_id}
                                    value={t.terminal_id.toString()}
                                >
                                    {t.name}
                                </SelectItem>
                            ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            {children}
        </>
    );
};


// ─────────────────────────────
// Cancel
// ─────────────────────────────

const CancelTerminalSelection = () => {
    const { value, onChange } = useTerminalSelectorContext();

    return (
        value && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onChange(null)}
                className="text-red-500 hover:text-red-700 h-9"
            >
                <X className="w-5 h-5" />
            </Button>
        )
    );
};


// ─────────────────────────────
// Create Terminal
// ─────────────────────────────

const CreateTerminal = ({ isShortCut = false }: { isShortCut?: boolean }) => {

    const { onChange, disabled } = useTerminalSelectorContext();
    const queryClient = useQueryClient();

    const [newTerminalData, setNewTerminalData] = useState<Omit<Terminal, 'terminal_id' | 'created_at' | 'organization_id'>>({
        name: "",
    });

    const [open, setOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            return await createTerminal(newTerminalData);
        },
        onSuccess: (created: { data: Terminal }) => {
            queryClient.invalidateQueries({ queryKey: ["terminals"] });
            onChange(created.data);
            setOpen(false);
            if (isShortCut) toast("Caja creada", { icon: "✅" });
        },
        onError: (error: any) => {
            toast(error.message, { icon: "⚠️" });
        },
    });

    const handleCreate = async () => {
        if (!newTerminalData.name) return;
        await mutation.mutateAsync();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Caja</SidebarMenuButton>
                ) : (
                    <Button
                        size="icon"
                        className="border border-gray-200"
                        disabled={disabled}
                        variant="outline"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nueva caja</DialogTitle>
                    <DialogDescription>
                        Completá el nombre de la caja.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Label>Nombre*</Label>
                    <Input
                        value={newTerminalData.name}
                        disabled={mutation.isPending}
                        onChange={(e) =>
                            setNewTerminalData({
                                ...newTerminalData,
                                name: e.target.value,
                            })
                        }
                        placeholder="Caja principal"
                    />
                </div>

                <DialogFooter>
                    <Button
                        disabled={mutation.isPending}
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        disabled={mutation.isPending || !newTerminalData.name}
                        onClick={handleCreate}
                    >
                        {mutation.isPending ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// ─────────────────────────────
// Exports
// ─────────────────────────────

export {
    TerminalSelectorRoot,
    SelectTerminal,
    CancelTerminalSelection,
    CreateTerminal,
};
