
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getClientTransactions } from "@/service/clientTransactions";
import type { ClientTransaction } from "@/types/clientTransactions";
import { Loader2 } from "lucide-react";

type EnrichedTransaction = ClientTransaction & {
    signedAmount: number;
    partialBalance: number;
};

function formatCurrency(value: number) {
    try {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `$${value.toFixed(2)}`;
    }
}

function formatDate(value: string) {
    try {
        return new Date(value).toLocaleString("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
        });
    } catch {
        return value;
    }
}

function isPaymentType(t: string | undefined) {
    const v = (t ?? "").toLowerCase();
    // Common payment/credit words in ES/EN
    return /payment|credit|pago|abono|cobro/.test(v);
}

const ClientHistoricalMvts = ({
    selectedClientId,
}: {
    selectedClientId?: string | number;
}) => {



    const { data, isLoading, isError, error } = useQuery<ClientTransaction[]>({
        queryKey: ["client_transactions", selectedClientId],
        queryFn: () => getClientTransactions(selectedClientId!),
        enabled: !!selectedClientId,
    });

    console.log("Fetched transactions:", selectedClientId, data);

    const movements: EnrichedTransaction[] = useMemo(() => {
        if (!data) return [];

        let running = 0;
        return data.map((t) => {
            let signed = t.amount;
            // If backend didn't provide sign, infer from transaction_type
            if (signed >= 0 && isPaymentType(t.transaction_type)) {
                signed = -Math.abs(signed);
            }
            // Accumulate to see debt evolution (positive = increases debt, negative = decreases)
            running += signed;

            return {
                ...t,
                signedAmount: signed,
                partialBalance: running,
            };
        });
    }, [data]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" disabled={!selectedClientId}>
                    Ver historial de cuenta
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
                <div className="flex h-full flex-col">
                    <div className="border-b px-6 py-4">
                        <SheetHeader>
                            <SheetTitle>Histórico de movimientos</SheetTitle>
                            <SheetDescription>
                                Cliente #{selectedClientId ?? "-"}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {isLoading && (
                            <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando movimientos...
                            </div>
                        )}

                        {isError && (
                            <div className="p-6 text-sm text-red-600">
                                Error al cargar movimientos: {error instanceof Error ? error.message : "Desconocido"}
                            </div>
                        )}

                        {!isLoading && !isError && movements.length === 0 && (
                            <div className="p-6 text-sm text-muted-foreground">
                                No hay movimientos para este cliente.
                            </div>
                        )}

                        {!isLoading && !isError && movements.length > 0 && (
                            <div className="px-6 py-4">
                                <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 border-b bg-background px-2 py-2 text-xs font-medium text-muted-foreground">
                                    <div className="col-span-3">Fecha</div>
                                    <div className="col-span-2">Tipo</div>
                                    <div className="col-span-3">Detalle</div>
                                    <div className="col-span-2 text-right">Monto</div>
                                    <div className="col-span-2 text-right">Saldo parcial</div>
                                </div>

                                <div className="divide-y">
                                    {movements.map((m) => {
                                        const isNegative = m.signedAmount < 0;
                                        const detail =
                                            m.description ??
                                            (m.order_id ? `Orden #${m.order_id}` : "-");

                                        return (
                                            <div
                                                key={m.transaction_id}
                                                className="grid grid-cols-12 gap-2 px-2 py-3 text-sm"
                                            >
                                                <div className="col-span-3">{formatDate(m.created_at)}</div>
                                                <div className="col-span-2">{m.transaction_type}</div>
                                                <div className="col-span-3 truncate">{detail}</div>
                                                <div
                                                    className={
                                                        "col-span-2 text-right " +
                                                        (isNegative ? "text-emerald-600" : "text-red-600")
                                                    }
                                                >
                                                    {formatCurrency(m.signedAmount)}
                                                </div>
                                                <div className="col-span-2 text-right font-medium">
                                                    {formatCurrency(m.partialBalance)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ClientHistoricalMvts;