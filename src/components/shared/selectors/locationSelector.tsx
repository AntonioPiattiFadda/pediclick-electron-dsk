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

import type { Location } from "@/types/locations";
import { Label } from "@/components/ui/label";
import { createLocation, getLocations } from "@/service/locations";

// ─────────────────────────────
// Context
// ─────────────────────────────

interface LocationSelectorContextType {
    value: Location | null;
    onChange: (loc: Location | null) => void;
    disabled: boolean;
    locations: Location[];
    isLoading: boolean;
    omitId?: number | null;
}

const LocationSelectorContext =
    createContext<LocationSelectorContextType | null>(null);

function useLocationSelectorContext() {
    const ctx = useContext(LocationSelectorContext);
    if (!ctx)
        throw new Error(
            "LocationSelector components must be used inside the Root"
        );
    return ctx;
}

// ─────────────────────────────
// Root
// ─────────────────────────────

interface RootProps {
    value: Location | null;
    onChange: (location: Location | null) => void;
    disabled?: boolean;
    children: ReactNode;
    omitId?: number | null;
    filter?: 'STORES' | 'STOCK_ROOMS';
}

const LocationSelectorRoot = ({
    value,
    onChange,
    disabled = false,
    children,
    omitId,
    filter = undefined,
}: RootProps) => {
    const { data: locations, isLoading, isError } = useQuery({
        queryKey: ["locations"],
        queryFn: async () => {
            const response = await getLocations();
            return response.locations.filter(location => {
                if (filter === 'STORES') {
                    return location.type === 'STORE';
                } else if (filter === 'STOCK_ROOMS') {
                    return location.type === 'STOCK_ROOM';
                }
                return true;
            });
        },
        enabled: true,
    });

    if (isError) {
        return <div>Error loading locations.</div>;
    }

    return (
        <LocationSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                locations: locations ?? [],
                isLoading,
                omitId,
            }}
        >
            <div className="flex items-center gap-2 w-full h-10">{children}</div>
        </LocationSelectorContext.Provider>
    );
};

// ─────────────────────────────
// Select
// ─────────────────────────────

const SelectLocation = ({ children }: { children?: ReactNode }) => {

    const { value, onChange, disabled, locations, isLoading, omitId } =
        useLocationSelectorContext();

    if (isLoading) {
        return (
            <Input className="h-10" placeholder="Cargando ubicaciones..." disabled />
        );
    }

    const locationTypes = {
        STORE: "Punto de venta",
        STOCK_ROOM: "Depósito",
    };

    return (
        <>
            <Select
                disabled={disabled}
                value={value?.location_id?.toString() ?? ""}
                onValueChange={(val) => {
                    const selected = locations.find(
                        (l) => l.location_id?.toString() === val
                    );
                    onChange(selected ?? null);
                }}
            >
                <SelectTrigger className="h-11 w-full border-gray-200">
                    <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Ubicaciones</SelectLabel>
                        {locations.filter(l => l.location_id !== omitId).map((l) => (
                            <SelectItem
                                key={l.location_id}
                                value={l.location_id?.toString() ?? ""}
                            >
                                {`${locationTypes[l.type as keyof typeof locationTypes]} - ${l.name}`}
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

const CancelLocationSelection = () => {
    const { value, onChange } = useLocationSelectorContext();

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
// Create Location
// ─────────────────────────────

const CreateLocation = ({ isShortCut = false }: { isShortCut?: boolean }) => {
    const { onChange, disabled } = useLocationSelectorContext();
    const queryClient = useQueryClient();

    const [newLocationData, setNewLocationData] = useState<Omit<Location, "location_id" | "created_at" | "deleted_at">>({
        name: "",
        address: "",
        type: "STORE",
    });

    const [open, setOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            return await createLocation(newLocationData);
        },
        onSuccess: (created: { data: Location }) => {
            queryClient.invalidateQueries({ queryKey: ["locations"] });
            onChange(created.data);
            setOpen(false);

            if (isShortCut) toast("Ubicación creada", { icon: "✅" });
        },
        onError: (error: any) => {
            toast(error.message, { icon: "⚠️" });
        },
    });

    const handleCreate = async () => {
        if (!newLocationData.name) return;
        await mutation.mutateAsync();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ? (
                    <SidebarMenuButton>Ubicación</SidebarMenuButton>
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
                    <DialogTitle>Crear nueva ubicación</DialogTitle>
                    <DialogDescription>
                        Completá los datos para crear la ubicación.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Label>Nombre*</Label>
                    <Input
                        value={newLocationData.name}
                        disabled={mutation.isPending}
                        onChange={(e) =>
                            setNewLocationData({
                                ...newLocationData,
                                name: e.target.value,
                            })
                        }
                        placeholder="Nombre"
                    />
                </div>


                <div className="flex flex-col gap-2">
                    <Label>Tipo*</Label>
                    <Select
                        value={newLocationData.type}
                        onValueChange={(val: "STORE" | "STOCK_ROOM") =>
                            setNewLocationData({ ...newLocationData, type: val })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="STORE">Punto de venta</SelectItem>
                            <SelectItem value="STOCK_ROOM">Depósito</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-2">
                    <Label>Dirección</Label>
                    <Input
                        value={newLocationData.address}
                        disabled={mutation.isPending}
                        onChange={(e) =>
                            setNewLocationData({
                                ...newLocationData,
                                address: e.target.value,
                            })
                        }
                        placeholder="Dirección"
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
                        disabled={
                            mutation.isPending ||
                            !newLocationData.name
                        }
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
    LocationSelectorRoot,
    SelectLocation,
    CancelLocationSelection,
    CreateLocation,
};
