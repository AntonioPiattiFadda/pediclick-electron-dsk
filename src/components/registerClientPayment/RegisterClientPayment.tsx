
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyPayments, paymentMethodOpt } from "@/constants";
import { useModalsContext } from "@/context/ModalsContext";
import { registerClientPayment } from "@/service/payments";
import { CheckOutOptions } from '@/types';
import type { Client } from '@/types/clients';
import { Payment } from "@/types/payments";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { MoneyInput } from "../shared/MoneyInput";
import { CancelClientSelection, ClientSelectorRoot, SelectClient } from "../shared/selectors/clientSelector";
import { useTerminalSessionData } from "@/hooks/useTerminalSessionData";


const RegisterClientPayment = ({ client }: {
    client?: Client;
}) => {
    const { clientPaymentModalOpen, setClientPaymentModalOpen } = useModalsContext();

    const [selectedClient, setSelectedClient] = useState<Client | null>(client || null);

    const [payments, setPayments] = useState<Pick<Payment, "payment_method" | "amount">[]>(emptyPayments.map(p => ({
        ...p,
        payment_type: 'CLIENT_PAYMENT',
    })));
    const totalPayment = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const queryClient = useQueryClient();

    // const { handlePrintPayment } = usePrinter();

    const [checkOutOptions, setCheckOutOptions] = useState<CheckOutOptions>({
        printTicket: false,
        registerPositiveCredit: false,
    });

    const { handleGetTerminalSessionId } = useTerminalSessionData();

    const registerClientPaymentMutation = useMutation({
        mutationFn: async () => {
            const terminalSessionId = await handleGetTerminalSessionId();

            const adaptedPayments = [...payments].map(p => ({
                ...p,
                terminal_session_id: terminalSessionId,
            }));

            const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

            const change = totalPayments;

            const overPaymentMethod = {
                payment_method: 'OVERPAYMENT',
                amount: Number(change.toFixed(2)),
                payment_direction: "IN",
                payment_type: "CLIENT_PAYMENT",
                terminal_session_id: terminalSessionId,
            };

            adaptedPayments.push(overPaymentMethod as Pick<Payment, "payment_method" | "amount" | "payment_direction" | "payment_type" | "terminal_session_id">);

            // const a = adaptedPayments.find(p => p.payment_method === 'ON_CREDIT');
            // const b = adaptedPayments.find(p => p.payment_method === 'CASH');
            // const c = adaptedPayments.find(p => p.payment_method === 'OVERPAYMENT');

            console.log("adaptedPayments to register:", adaptedPayments);


            return await registerClientPayment(adaptedPayments, selectedClient!.client_id);
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Orden creada:", data)

            const queryKey = ["client-transaction-movements", selectedClient!.client_id, 1];
            const queryKeyClientInformation = ["clients", selectedClient!.client_id];

            queryClient.invalidateQueries({ queryKey });
            queryClient.refetchQueries({ queryKey: queryKeyClientInformation });
            queryClient.refetchQueries({ queryKey: ["clients"] });

            setClientPaymentModalOpen(false);
            setSelectedClient(null);
            setPayments(emptyPayments.map(p => ({
                ...p,
                payment_type: 'CLIENT_PAYMENT',
            })));

            toast.success("Pago registrado correctamente")

            // const printContent: PrintTicketPayload = {
            //     // user: null,
            //     // location: {
            //     //     location_id: handleGetLocationId(),
            //     //     name: handleGetLocation()?.name,
            //     //     address: handleGetLocation()?.address,
            //     //     type: 'STORE',
            //     //     created_at: '',
            //     //     deleted_at: null,
            //     // },
            //     // order: orderToPrint[0],
            //     // orderItems: orderItemsToPrint
            // };

            // if (checkOutOptions.printTicket) {
            //     alert("Imprimiendo ticket...");
            //     handlePrintTicket(printContent);
            // }


        },
        onError: (e) => {
            console.error("Error al registrar el pago", e)
            toast.error("Error al registrar el pago: " + (e instanceof Error ? e.message : "Error desconocido"))
        },
    })




    return (
        <Dialog open={clientPaymentModalOpen} onOpenChange={setClientPaymentModalOpen} >
            <DialogTrigger asChild>

                <Button className="hidden" >
                    Registrar pago de cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader className="flex flex-row justify-between">
                    <div>
                        <DialogTitle>Registrar pago de cliente</DialogTitle>
                        <DialogDescription>
                            Complete la información para registrar el pago del cliente.
                        </DialogDescription>
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

                <div className="flex flex-col gap-1">
                    <Label>
                        Cliente:
                    </Label>
                    <ClientSelectorRoot
                        value={selectedClient || null}
                        onChange={v => {
                            setSelectedClient(v);
                        }}
                        showInfo={true}
                    >
                        <SelectClient />
                        <CancelClientSelection />

                    </ClientSelectorRoot>
                </div>


                <div className="space-y-4">

                    <div className="mt-2 flex gap-2">
                        <Label>Opciones:</Label>
                        <div className="flex gap-2">
                            <Checkbox checked={checkOutOptions.printTicket} onCheckedChange={(e) => setCheckOutOptions({ ...checkOutOptions, printTicket: e as boolean })} />
                            <Label className="text-xs font-normal">Imprimir ticket</Label>
                        </div>
                    </div>

                    <div className="mt-2 space-y-2">
                        <Label>Pagos</Label>

                        {payments
                            .filter(p => p.payment_method !== 'ON_CREDIT')
                            .map((p, idx) => {
                                return (<div key={idx} className="grid grid-cols-10 gap-2 items-center">
                                    <div>
                                        <Input
                                            value={paymentMethodOpt.find((o) => o.value === p.payment_method)?.keyCode || ''}
                                            disabled
                                        />

                                    </div>
                                    <div className="col-span-4">
                                        <Input
                                            value={paymentMethodOpt.find((o) => o.value === p.payment_method)?.label || ''}
                                            disabled
                                        />

                                    </div>


                                    <div className="col-span-4">
                                        <MoneyInput
                                            value={p.amount || undefined}
                                            onChange={(v) => {
                                                const numberValue = Number(v);

                                                // if (p.payment_method === 'ON_CREDIT' && numberValue > clientAvailableCredit) {
                                                //     toast.error('Limite de credito para cliente alcanzado: ' + formatCurrency(clientAvailableCredit))
                                                //     return
                                                // }

                                                if (numberValue < 0) {
                                                    setPayments((prev) =>
                                                        prev.map((pay, i) =>
                                                            i === idx ? { ...pay, amount: 0 } : pay
                                                        )
                                                    );
                                                    return;
                                                }

                                                setPayments((prev) =>
                                                    prev.map((pay, i) =>
                                                        i === idx ? { ...pay, amount: numberValue } : pay
                                                    )
                                                );
                                            }}
                                        />
                                        {/* <InputGroup>
                                                    <InputGroupInput
                                                      type="number"
                                                    />
                                                    <InputGroupAddon>
                                                      $
                                                    </InputGroupAddon>
                                                  </InputGroup> */}

                                        {/* <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={p.amount ?? 0}
                                                    onChange={(e) => {
                                                      const amount = Number(e.target.value || 0);
                                                      console.log(amount)
                                                      setPayments((prev) =>
                                                        prev.map((pay, i) =>
                                                          i === idx ? { ...pay, amount } : pay
                                                        )
                                                      );
                                                    }}
                                                  /> */}
                                    </div>



                                    <div className="col-span-1">
                                        {/* <Button
                                        onClick={() => handleAssignRest(p.payment_method)}
                                        size={'icon'}
                                        variant={'ghost'}
                                        className="col-span-1 cursor-pointer"
                                        disabled={Number(remaining) <= 0}
                                    >
                                        <ChevronRight />
                                    </Button> */}
                                    </div>
                                </div>)
                            })}

                        <div className="flex flex-col justify-between  text-sm">
                            {/* <div>
                                Restante:{" "}
                                <span className={Number(remaining) === 0 ? "text-green-600" : "text-amber-600"}>
                                    {formatCurrency(remainingToShow)}
                                </span>
                            </div>
                            <div>
                                Vuelto:{" "}
                                <span className={Number(remaining) === 0 ? "text-green-600" : "text-amber-600"}>
                                    {formatCurrency(changeOrCredit)}
                                </span>
                            </div> */}
                            {/* <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  setPayments((prev) => [
                    ...prev,
                    { method: "CASH", amount: Math.max(0, Number(totals.total) - paidSum) },
                  ])
                }
              >
                Agregar pago
              </Button> */}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline"
                        onClick={() => setClientPaymentModalOpen(false)}
                        disabled={registerClientPaymentMutation.isPending}
                    >
                        Volver
                    </Button>
                    <Button
                        onClick={() => {
                            registerClientPaymentMutation.mutate();
                        }}
                        // btnRef={confirmOrderRef}
                        disabled={payments.length === 0 || registerClientPaymentMutation.isPending || totalPayment <= 0 || selectedClient === null}
                    >
                        {registerClientPaymentMutation.isPending ? "Registrando..." : "Registrar pago"}
                    </Button>
                    {/* <Button

          >

          </Button> */}
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}

export default RegisterClientPayment