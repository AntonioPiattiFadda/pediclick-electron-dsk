
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
import { Spinner } from "../ui/spinner";


const TerminalSessionClosure = () => {
    const { terminalSessionClosure, setTerminalSessionClosure } = useModalsContext();

    const { handleGetTerminalSessionId } = useTerminalSessionData()

    const { data: terminalSessionData, isLoading, isError } = useQuery({
        queryKey: ["terminalSessionClosureData"],
        queryFn: async () => {
            const terminalSessionId = handleGetTerminalSessionId(); // Implement this function to get the current terminal session ID
            const response = await getTerminalSessionClosureData(terminalSessionId);
            return response;
        },
        enabled: terminalSessionClosure // Only run the query when the modal is open
    });

    console.log("terminalSessionData", terminalSessionData);

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
                {isLoading ? (
                    <div>
                        <Spinner />
                    </div>
                ) : isError ? (
                    <div>Error al cargar los datos.</div>
                ) : (
                    <div>
                        Datos
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