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
import { createClient, getClients } from "@/service/clients";
import type { Client } from "@/types/clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";
import { toast } from "sonner";

// ---------- Context ----------
interface ClientSelectorContextType {
    value: Client | null;
    onChange: (client: Client | null) => void;
    disabled: boolean;
    clients: Client[];
    isLoading: boolean;
    shortCode: number | null;
    onChangeShortCode: (shortCode: number | null) => void;
    showInfo: boolean;
}

const ClientSelectorContext =
    createContext<ClientSelectorContextType | null>(null);

function useClientSelectorContext() {
    const ctx = useContext(ClientSelectorContext);
    if (!ctx)
        throw new Error("ClientSelector components must be used inside Root");
    return ctx;
}

// ---------- Root ----------
interface RootProps {
    value: Client | null;
    onChange: (client: Client | null) => void;
    disabled?: boolean;
    children: ReactNode;
    shortCode?: number | null;
    showInfo: boolean;

}

const ClientSelectorRoot = ({ value, onChange, disabled = false, children, showInfo }: RootProps) => {
    const { data: clients, isLoading, isError } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getClients();
            return response.clients;
        },
    });

    const [shortCode, setShortCode] = useState<number | null>(value?.short_code ?? null);

    if (isError) {
        return <div>Error loading team members.</div>;
    }

    return (
        <ClientSelectorContext.Provider
            value={{
                value,
                onChange,
                disabled,
                clients: clients ?? [],
                isLoading,
                shortCode,
                onChangeShortCode: setShortCode,
                showInfo
            }}
        >
            <div className="flex items-center gap-2 w-full">{children}</div>
        </ClientSelectorContext.Provider>
    );
};

// ---------- Select ----------
const SelectClient = () => {
    const { value, onChange, disabled, clients, isLoading,
        onChangeShortCode, showInfo
    } = useClientSelectorContext();


    // const handleCodeMatch = (code: number) => {
    //     if (!code) return;
    //     const matched = clients.find((m) => m.short_code === code);
    //     if (matched) {
    //         onChange(matched);
    //         debouncedToast.cancel();
    //     } else {
    //         onChange(null);
    //         debouncedToast(`No se encontró ningún cliente con el código: ${code}`);
    //     }
    // };

    // const debouncedToast = useMemo(
    //     () =>
    //         debounce((msg: string) => {
    //             toast(msg, { icon: "⚠️" });
    //         }, 500),
    //     []
    // );

    if (isLoading) {
        return <Input className="h-10" placeholder="Buscando tus clientes..." disabled />;
    }

    return (
        <>
            <div className="flex flex-col gap-4 w-full">
                <div className="flex w-full border border-gray-200 rounded-md ">
                    {/* <Input
                    className={`  border-none    h-9 w-14 `}
                    value={shortCode ?? ""}
                    placeholder="Código"
                    disabled={disabled}
                    onChange={(e) => {
                        const val = e.target.value;
                        onChangeShortCode(Number(val));
                        handleCodeMatch(Number(val));
                    }}
                /> */}

                    <Select
                        disabled={disabled}
                        value={value?.client_id?.toString() ?? ""}
                        onValueChange={(val) => {
                            const m = clients.find((m) => m.client_id === Number(val)) || null;
                            onChange(m);
                            onChangeShortCode(m?.short_code ?? null);
                        }}
                    >
                        <SelectTrigger className="h-11 w-full border-none">
                            <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Clientes</SelectLabel>
                                {(clients && clients.length > 0) ? clients.map((m) => {
                                    const label = m.short_code ? `${m.short_code} - ${m.full_name}` : m.full_name;
                                    return (
                                        <SelectItem
                                            key={m.client_id}
                                            value={m?.client_id?.toString() || ""}>
                                            {label}
                                        </SelectItem>
                                    )
                                }) : <SelectItem value="" disabled>No hay clientes disponibles</SelectItem>}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[115%]">
                    {showInfo &&
                        <ClientInformation selectedClient={clients.find(c => c.client_id === Number(value?.client_id))!} />
                    }
                </div>

            </div>
        </>
    );
};

import { Label } from "@/components/ui/label";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { taxConditionsOpt } from "@/constants";
import { formatCurrency } from "@/utils/prices";
import { formatDate } from "@/utils";
import ClientHistoricalMvts from "@/pages/inSiteOrders/components/clientHistoricalMvts";


const CreateClient = ({ isShortCut = false }: {
    isShortCut?: boolean;
}) => {
    const { onChange, disabled } = useClientSelectorContext();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Client>>({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        tax_ident: "",
        tax_condition: "FINAL_CONSUMER",
        billing_enabled: true,
        credit_limit: 0,
        current_balance: 0,
        available_credit: 0,
        is_active: true,
    });

    // 🔁 Mutación para crear cliente
    const createClientMutation = useMutation({
        mutationFn: async (data: Partial<Client>) => {

            const adaptedClient = {
                ...data,
                available_credit: data.credit_limit || 0,
            }
            return await createClient(adaptedClient);
        },
        onSuccess: (data: Client) => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            onChange(data || null);
            toast.success("Cliente creado correctamente");
            setOpen(false);
            setFormData({
                full_name: "",
                email: "",
                phone: "",
                address: "",
                tax_ident: "",
                tax_condition: "FINAL_CONSUMER",
                billing_enabled: true,
                credit_limit: 0,
                current_balance: 0,
                available_credit: 0,
                is_active: true,
            });
            if (isShortCut) {
                toast.success("Cliente creado");
            }
        },
        onError: (error: any) => {
            toast.error("Error al crear cliente", {
                description: error.message,
            });
        },
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleToggle = (name: keyof Client) => {
        setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    const handleCreateClient = async () => {
        if (!formData.full_name?.trim()) {
            toast.error("El nombre del cliente es obligatorio");
            return;
        }

        try {
            await createClientMutation.mutateAsync(formData);
        } catch (err) {
            console.error("Error creating client:", err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isShortCut ?
                    <SidebarMenuButton>Cliente</SidebarMenuButton>
                    : <Button
                        className="border border-gray-200 mb-auto"
                        disabled={disabled}
                        variant="outline"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </Button>}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo cliente</DialogTitle>
                    <DialogDescription>
                        Completá los datos del cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                        <Label>Nombre / Razón social *</Label>
                        <Input
                            name="full_name"
                            placeholder="Nombre..."
                            value={formData.full_name || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label>Email</Label>
                        <Input
                            name="email"
                            type="email"
                            placeholder="cliente@correo.com"
                            value={formData.email || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label>Teléfono</Label>
                            <Input
                                name="phone"
                                placeholder="351..."
                                value={formData.phone || ""}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label>CUIT</Label>
                            <Input
                                name="tax_ident"
                                placeholder="Numero de cuit"
                                value={formData.tax_ident || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <Label>Dirección</Label>
                        <Input
                            name="address"
                            placeholder="Ingresa dirección"
                            value={formData.address || ""}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1">
                            <Label>Cond. IVA</Label>
                            <Select name="tax_condition"
                                value={formData.tax_condition}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        tax_condition: value as any,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar condición" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Condiciones de IVA</SelectLabel>
                                        {taxConditionsOpt.map((condition) => (
                                            <SelectItem key={condition.value} value={condition.value}>
                                                {condition.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>


                            {/* <Input
                                name="tax_condition"
                                placeholder="Responsable inscripto"
                                value={formData.tax_condition || ""}
                                onChange={handleChange}
                            /> */}
                        </div>
                        <div className="grid gap-1">
                            <Label>Límite de crédito</Label>
                            <Input
                                name="credit_limit"
                                type="number"
                                placeholder="--"
                                value={formData.credit_limit || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="billing_enabled">Facturación</Label>
                        <Switch
                            id="billing_enabled"
                            checked={formData.billing_enabled}
                            onCheckedChange={() => handleToggle("billing_enabled")}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        disabled={createClientMutation.isPending}
                        onClick={() => setOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreateClient}
                        disabled={createClientMutation.isPending}
                    >
                        {createClientMutation.isPending ? "Creando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// -------- Cancel ----------
const CancelClientSelection = () => {
    const { value, onChange, onChangeShortCode } = useClientSelectorContext();

    return (
        value && (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    onChange(null);
                    onChangeShortCode(null);
                }}
                className="text-red-500 hover:text-red-700 h-9 mb-auto"
            >
                <X className="w-5 h-5" />
            </Button>
        )
    );
};

const ClientInformation = ({
    selectedClient,
    showHistoricalMvtsBtn = true
}: {
    selectedClient: Client;
    showHistoricalMvtsBtn?: boolean;
}) => {


    return (selectedClient && (
        <div className="w-full">

            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-x-4 gap-y-1 text-xs">
                <div className='flex flex-col gap-2 text-center'>
                    <Label className='flex items-center justify-center'>Credito disponible</Label>
                    <span>{formatCurrency(selectedClient.available_credit)}</span>
                </div>

                <div className='flex flex-col gap-2 text-center'>
                    <Label className='flex items-center justify-center'>Credito disponible</Label>
                    <span>{formatCurrency(selectedClient.credit_limit || 0)}</span>
                </div>

                <div className='flex flex-col gap-2 text-center'>
                    <Label className='flex items-center justify-center'>Saldo actual</Label>
                    <span>{formatCurrency(selectedClient.current_balance)}</span>
                </div>

                <div className='flex flex-col gap-2 text-center'>
                    <Label className='flex items-center justify-center'>Cond. impositiva</Label>
                    <span>{taxConditionsOpt.find(opt => opt.value === selectedClient.tax_condition)?.label}</span>
                </div>

                <div className='flex flex-col gap-2 text-center'>
                    <Label className='flex items-center justify-center'>Últ. transacción</Label>
                    <span>{formatDate(selectedClient.last_transaction_date)}</span>
                </div>

                {showHistoricalMvtsBtn && (
                    <ClientHistoricalMvts selectedClientId={selectedClient.client_id} />
                )}

            </div>

        </div>


    )
    )
}


// ---------- Compound export ----------
export {
    ClientSelectorRoot,
    CreateClient,
    SelectClient,
    CancelClientSelection,
    ClientInformation
};

