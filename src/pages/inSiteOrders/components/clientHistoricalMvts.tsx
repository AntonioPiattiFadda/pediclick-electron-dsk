
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { paymentMethodOpt } from "@/constants";
import { getClientTransactions } from "@/service/clientTransactions";
import type { ClientTransaction } from "@/types/clientTransactions";
import { formatDate } from "@/utils";
import { formatCurrency } from "@/utils/prices";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, History, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import ClientInformationContainer from "./clientInformationContainer";

const CLIENT_MOVEMENTS_PAGE_SIZE = 10;

const ClientHistoricalMvts = ({
    selectedClientId,
}: {
    selectedClientId: number;
}) => {

    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: CLIENT_MOVEMENTS_PAGE_SIZE,
    });

    const { data, isLoading, isError, error } = useQuery<ClientTransaction[]>({
        queryKey: ["client-transaction-movements", selectedClientId, pagination.page],
        queryFn: () => getClientTransactions(selectedClientId!, pagination.page, pagination.pageSize),
        enabled: !!selectedClientId,
    });


    const movements: ClientTransaction[] = useMemo(() => data?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [], [data]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size={'icon'} disabled={!selectedClientId}>
                    <History className="h-4 w-4" />
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
                <div className="flex h-full flex-col">
                    <SheetHeader>
                        <SheetTitle>Histórico de movimientos</SheetTitle>
                        <SheetDescription className="mt-2 -mb-2 ">
                            <ClientInformationContainer
                                showHistoricalMvtsBtn={false}
                                clientId={selectedClientId!}
                            />
                        </SheetDescription>
                    </SheetHeader>

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
                                <div className="sticky top-0 z-10 grid grid-cols-5 gap-2 border-b  bg-background px-2 py-2 text-xs font-medium text-muted-foreground">
                                    <div className="">Fecha</div>
                                    <div className="">Detalle</div>
                                    <div className="">Tipo</div>
                                    <div className="">Monto</div>
                                    <div className="text-right">Saldo</div>
                                </div>

                                <div className="divide-y ">
                                    {movements.map((m) => {

                                        const after = m.balance_after_transaction ?? 0;

                                        const isDebt = after < 0; // rojo si < 0 (debe), verde si >= 0

                                        const showBalanceAfter = m.payment_method === 'ON_CREDIT' || m.payment_method === 'OVERPAYMENT';

                                        return (
                                            <div
                                                key={m.transaction_id}
                                                className="grid grid-cols-5 gap-2 px-2 py-3 text-sm"
                                            >
                                                <div className="col-span-1">{formatDate(m.created_at)}</div>
                                                <div className="col-span-1 truncate">{`Order: ${m.order_id ?? "-"}`}</div>

                                                <div className="col-span-1 truncate">{paymentMethodOpt.find(opt => opt.value === m.payment_method)?.label || "-"}</div>

                                                {/* Monto de la transacción (informativo, sin énfasis) */}
                                                <div className="col-span-1 text-right text-muted-foreground">
                                                    {formatCurrency(m.amount)}
                                                </div>

                                                {/* Saldo después de la transacción: foco principal */}
                                                <div
                                                    className={
                                                        "col-span-1 text-right font-semibold " +
                                                        (isDebt ? "text-red-600" : "text-emerald-600")
                                                    }
                                                >
                                                    {showBalanceAfter && formatCurrency(after)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-2 flex justify-end items-center gap-2">
                        {/* Pagination Controls could go here */}
                        <Button size={'icon'}
                            disabled={pagination.page === 1}
                            onClick={() => setPagination((prev) => ({
                                ...prev,
                                page: Math.max(prev.page - 1, 1),
                            }))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span>
                            Página {pagination.page}
                        </span>
                        <Button
                            size={'icon'}
                            disabled={movements.length < CLIENT_MOVEMENTS_PAGE_SIZE}
                            onClick={() => setPagination((prev) => ({
                                ...prev,
                                page: prev.page + 1,
                            }))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ClientHistoricalMvts;