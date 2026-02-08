import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useModalsContext } from "@/context/ModalsContext";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";
import { getTerminalSessionClosureData } from "@/service/terminalSessions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Spinner } from "../../ui/spinner";
import { useState, useMemo } from "react";
import { Payment, PaymentMethod } from "@/types/payments";
import { CheckCircle2, AlertCircle, Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/service";

// ┌─────────────────────────────────────────────────────────────┐
// │  ✕ Cierre de Caja - Terminal #3                            │
// ├─────────────────────────────────────────────────────────────┤
// │                                                             │
// │  📅 Fecha: 08/02/2026    ⏰ Hora Apertura: 08:30           │
// │  👤 Cajero: Juan Pérez   ⏰ Hora Cierre: 18:45             │
// │                                                             │
// ├─────────────────────────────────────────────────────────────┤
// │  💰 EFECTIVO                                                │
// │  ├─ Monto Inicial:              $10,000.00                 │
// │  ├─ Ventas en Efectivo:         $45,320.50                 │
// │  ├─ Retiros:                    -$5,000.00                 │
// │  └─ Efectivo Esperado:          $50,320.50                 │
// │                                                             │
// │  ┌─────────────────────────────────────────────────────┐   │
// │  │ 💵 Efectivo Real:  [____________]  (Contar)        │   │
// │  └─────────────────────────────────────────────────────┘   │
// │                                                             │
// │  Diferencia: $0.00  ✓                                      │
// │                                                             │
// ├─────────────────────────────────────────────────────────────┤
// │  💳 OTROS MÉTODOS DE PAGO                                   │
// │  ├─ Tarjeta Débito:              $32,150.00                │
// │  ├─ Tarjeta Crédito:             $28,900.00                │
// │  ├─ Transferencias:              $12,500.00                │
// │  └─ QR/Billeteras:               $8,430.00                 │
// │                                                             │
// ├─────────────────────────────────────────────────────────────┤
// │  📊 RESUMEN                                                 │
// │  ├─ Total Ventas:               $127,300.50                │
// │  ├─ Cantidad de Tickets:         87                        │
// │  ├─ Ticket Promedio:            $1,463.22                  │
// │  └─ Productos Vendidos:          342                       │
// │                                                             │
// ├─────────────────────────────────────────────────────────────┤
// │  📝 Observaciones:                                          │
// │  ┌─────────────────────────────────────────────────────┐   │
// │  │ [Ej: Billete de $1000 falso detectado...]          │   │
// │  │                                                     │   │
// │  │                                                     │   │
// │  └─────────────────────────────────────────────────────┘   │
// │                                                             │
// ├─────────────────────────────────────────────────────────────┤
// │                                                             │
// │         [Volver]  [Imprimir Reporte]  [Cerrar Caja] ✓     │
// │                                                             │
// └─────────────────────────────────────────────────────────────┘


// Helper function to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(amount);
};

// Payment method labels
const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: "Efectivo",
    CREDIT_CARD: "Tarjeta Crédito",
    DEBIT_CARD: "Tarjeta Débito",
    BANK_TRANSFER: "Transferencias",
    MOBILE_PAYMENT: "QR/Billeteras Digitales",
    CHECK: "Cheques",
    CRYPTO: "Criptomonedas",
    ON_CREDIT: "A Crédito",
    OVERPAYMENT: "Sobrepago"
};

const TerminalSessionClosure = () => {
    const { terminalSessionClosure, setTerminalSessionClosure } = useModalsContext();
    const { handleGetTerminalSessionId } = useTerminalSessionData();
    const queryClient = useQueryClient();

    const [closingBalance, setClosingBalance] = useState<number | null>(null);

    const { data, isLoading, isError, isRefetching } = useQuery({
        queryKey: ["terminalSessionClosureData"],
        queryFn: async () => {
            const terminalSessionId = handleGetTerminalSessionId();
            const response = await getTerminalSessionClosureData(terminalSessionId);
            return response;
        },
        enabled: terminalSessionClosure,
        refetchOnMount: 'always',
    });

    // Calculate all financial data using useMemo
    const financialData = useMemo(() => {
        if (!data) return null;

        const { terminalSession, orders, payments } = data;

        // Cash from sales (order payments)
        const cashFromSales = orders
            .flatMap(order => order.payments || [])
            .filter(p => p.payment_method === "CASH" && p.payment_direction === "IN")
            .reduce((sum, p) => sum + p.amount, 0);

        // Cash from client payments
        const cashFromClientPayments = payments
            .filter(p =>
                p.payment_method === "CASH" &&
                p.payment_direction === "IN" &&
                p.payment_type === "CLIENT_PAYMENT"
            )
            .reduce((sum, p) => sum + p.amount, 0);

        // Cash to providers
        const cashToProviders = payments
            .filter(p =>
                p.payment_method === "CASH" &&
                p.payment_direction === "OUT" &&
                p.payment_type === "PROVIDER_PAYMENT"
            )
            .reduce((sum, p) => sum + p.amount, 0);

        // Expected cash
        const expectedCash = terminalSession.opening_balance + cashFromSales + cashFromClientPayments - cashToProviders;

        // All IN payments for other payment methods and summary
        const allInPayments: Payment[] = [
            ...orders.flatMap(o => o.payments || []),
            ...payments
        ].filter(p => p.payment_direction === "IN");

        // Aggregate by payment method (excluding cash)
        const paymentMethodTotals = allInPayments.reduce((acc, payment) => {
            if (payment.payment_method !== "CASH") {
                acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
            }
            return acc;
        }, {} as Record<PaymentMethod, number>);

        // Summary calculations
        const totalSales = allInPayments.reduce((sum, p) => sum + p.amount, 0);
        const ticketCount = orders.length;
        const averageTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

        return {
            terminalSession,
            user: data.user,
            cashFromSales,
            cashFromClientPayments,
            cashToProviders,
            expectedCash,
            paymentMethodTotals,
            totalSales,
            ticketCount,
            averageTicket
        };
    }, [data]);

    const difference = closingBalance !== null && financialData
        ? closingBalance - financialData.expectedCash
        : null;

    // Close session mutation
    const closeSessionMutation = useMutation({
        mutationFn: async () => {
            const terminalSessionId = handleGetTerminalSessionId();
            const { error } = await supabase
                .from("terminal_sessions")
                .update({
                    status: "CLOSED",
                    closed_at: new Date().toISOString(),
                    closing_balance: closingBalance,
                })
                .eq("terminal_session_id", terminalSessionId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Sesión de caja cerrada exitosamente");
            setTerminalSessionClosure(false);
            queryClient.invalidateQueries({ queryKey: ["terminalSessionClosureData"] });
            setClosingBalance(null);
        },
        onError: (error) => {
            toast.error("Error al cerrar la sesión");
            console.error(error);
        }
    });

    return (
        <Dialog open={terminalSessionClosure} onOpenChange={setTerminalSessionClosure}>
            <DialogTrigger asChild>
                <Button className="hidden">R</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cierre de Caja</DialogTitle>
                </DialogHeader>

                {isLoading || isRefetching ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : isError ? (
                    <div className="text-red-500 py-4">Error al cargar los datos.</div>
                ) : financialData ? (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Cajero: </span>
                                <span className="font-medium">{financialData.user?.email || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Fecha Apertura: </span>
                                <span className="font-medium">
                                    {new Date(financialData.terminalSession.opened_at).toLocaleString('es-AR')}
                                </span>
                            </div>
                        </div>

                        {/* Cash Section */}
                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">💰 EFECTIVO</h3>
                                <Button variant="outline" size="sm" disabled>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalles
                                </Button>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Monto Inicial:</span>
                                    <span className="font-medium">{formatCurrency(financialData.terminalSession.opening_balance)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ventas en Efectivo:</span>
                                    <span className="font-medium">{formatCurrency(financialData.cashFromSales)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pagos de Clientes:</span>
                                    <span className="font-medium">{formatCurrency(financialData.cashFromClientPayments)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pagos a Proveedores:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(financialData.cashToProviders)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="font-semibold">Efectivo Esperado:</span>
                                    <span className="font-bold">{formatCurrency(financialData.expectedCash)}</span>
                                </div>
                            </div>

                            {/* Cash Count Input */}
                            <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                                <label className="block">
                                    <span className="text-sm font-medium">💵 Efectivo Real (contado):</span>
                                    <Input
                                        type="number"
                                        placeholder="Ingrese el monto contado..."
                                        value={closingBalance ?? ""}
                                        onChange={(e) => setClosingBalance(e.target.value ? parseFloat(e.target.value) : null)}
                                        className="mt-1"
                                        step="0.01"
                                    />
                                </label>

                                {/* Difference Display */}
                                {difference !== null && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${difference === 0
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {difference === 0 ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5" />
                                        )}
                                        <span className="font-semibold">
                                            Diferencia: {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                                        </span>
                                        {difference === 0 && <span className="ml-auto">✓ Cuadra perfecto</span>}
                                    </div>
                                )}

                                {closingBalance === null && (
                                    <div className="text-muted-foreground text-sm text-center">
                                        Ingrese el efectivo contado para calcular la diferencia
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Other Payment Methods */}
                        <div className="border rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-lg">💳 OTROS MÉTODOS DE PAGO</h3>
                            <div className="space-y-2 text-sm">
                                {Object.entries(financialData.paymentMethodTotals)
                                    .filter(([method]) => !['ON_CREDIT', 'OVERPAYMENT'].includes(method))
                                    .map(([method, total]) => (
                                        <div key={method} className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                {PAYMENT_METHOD_LABELS[method as PaymentMethod]}:
                                            </span>
                                            <span className="font-medium">{formatCurrency(total)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="border rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-lg">📊 RESUMEN</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Ventas:</span>
                                    <span className="font-bold text-lg">{formatCurrency(financialData.totalSales)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cantidad de Tickets:</span>
                                    <span className="font-medium">{financialData.ticketCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ticket Promedio:</span>
                                    <span className="font-medium">{formatCurrency(financialData.averageTicket)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setTerminalSessionClosure(false)}
                        disabled={closeSessionMutation.isPending}
                    >
                        Volver
                    </Button>
                    <Button
                        variant="outline"
                        disabled
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir Reporte
                    </Button>
                    <Button
                        onClick={() => closeSessionMutation.mutate()}
                        disabled={closingBalance === null || closeSessionMutation.isPending}
                    >
                        {closeSessionMutation.isPending ? "Cerrando..." : "Cerrar Caja"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TerminalSessionClosure