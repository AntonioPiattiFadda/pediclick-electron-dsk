
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { useModalsContext } from "@/context/ModalsContext";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";
import { getTerminalSessionClosureData } from "@/service/terminalSessions";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../../ui/spinner";

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


const TerminalSessionClosure = () => {
    const { terminalSessionClosure, setTerminalSessionClosure } = useModalsContext();

    const { handleGetTerminalSessionId } = useTerminalSessionData()

    const { data: terminalSession, isLoading, isError, isRefetching } = useQuery({
        queryKey: ["terminalSessionClosureData"],
        queryFn: async () => {
            const terminalSessionId = handleGetTerminalSessionId(); // Implement this function to get the current terminal session ID
            const response = await getTerminalSessionClosureData(terminalSessionId);
            return response;
        },
        enabled: terminalSessionClosure, // Only run the query when the modal is open
        refetchOnMount: 'always',
    });

    console.log("Terminal Session Closure Data:", terminalSession);

    return (
        <Dialog open={terminalSessionClosure} onOpenChange={setTerminalSessionClosure} >
            <DialogTrigger asChild>

                <Button className="hidden" >
                    R
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader className="flex flex-row justify-between">
                    <div>
                        <DialogTitle>Cierre de caja</DialogTitle>
                        {/* <DialogDescription>
                            Complete la información para registrar el cierre de sesión de la terminal.
                        </DialogDescription> */}
                    </div>
                    <div className="space-y-1.5 mr-4">

                        {/* <Input
                            id="date"
                            type="date"
                            value={order.created_at ? order.created_at.split("T")[0] : ""}
                            onChange={(e) => onChangeOrder({ ...order, created_at: e.target.value })}
                        /> */}
                    </div>


                </DialogHeader>
                {isLoading || isRefetching ? (
                    <div>
                        <Spinner />
                    </div>
                ) : isError ? (
                    <div>Error al cargar los datos.</div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <span>
                            {terminalSession?.orders.length}
                        </span>
                        <span>
                            {terminalSession?.payments.length}
                        </span>
                    </div>

                )}



                <DialogFooter>
                    <Button variant="outline"
                        onClick={() => setTerminalSessionClosure(false)}
                    // disabled={registerClientPaymentMutation.isPending}
                    >
                        Volver
                    </Button>
                    <Button
                    // onClick={() => {
                    //     registerClientPaymentMutation.mutate();
                    // }}
                    // disabled={payments.length === 0 || registerClientPaymentMutation.isPending || totalPayment <= 0 || selectedClient === null}
                    >
                        asd {/* {registerClientPaymentMutation.isPending ? "Registrando..." : "Registrar pago"} */}
                    </Button>
                    {/* <Button

          >

          </Button> */}
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}

export default TerminalSessionClosure