import { useOrderContext } from '@/context/OrderContext'
import { useDeliveryOrderAiContext } from '@/context/DeliveryOrderAiContext'
import usePrinter from '@/hooks/usePrinter'
import { useTerminalSessionData } from '@/hooks/useTerminalSessionData'
import { createOrder } from '@/service/orders'
import { CheckOutOptions } from '@/types'
import { OrderT } from '@/types/orders'
import { Payment } from '@/types/payments'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import CheckoutOrder from './checkoutOrder'
import { DeleteCartItemButton } from './deleteCartItemButton'
import { DeleteOrderBtn } from './deleteOrderBtn'
import { EmptyCart } from './EmptyCart'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

const Cart = ({ order, onChangeOrder }: {
    order: OrderT,
    onChangeOrder: (order: OrderT) => void
}) => {

    const { resetAfterOrderCreation } = useOrderContext()
    const { orderItems, clearAiOrder } = useDeliveryOrderAiContext()

    const queryClient = useQueryClient();

    const { handlePrintTicket } = usePrinter();

    // const { handleGetLocationId, handleGetLocation } = useGetLocationData();

    const [checkOutOptions, setCheckOutOptions] = useState<CheckOutOptions>({
        printTicket: false,
        registerPositiveCredit: false,
    });

    type CreateOrderPayload = { order: typeof order; orderItems: typeof orderItems, payments?: Omit<Payment, 'payment_id' | 'created_at' | 'selected'>[] };

    const { handleGetTerminalSessionId } = useTerminalSessionData();

    const createOrderMutation = useMutation({
        mutationFn: async (payload: CreateOrderPayload) => {
            const terminalSessionId = await handleGetTerminalSessionId();
            let adaptedPayments = (payload.payments ?? []).map((p) => {
                return {
                    ...p,
                    terminal_session_id: terminalSessionId
                }
            });


            // NOTE Se da cambio por lo tanto se saca del cash el excedente
            if (!checkOutOptions.registerPositiveCredit) {

                //Formatt el payment en efectivo para que el monto total sea igual al total de la orden

                const totalOrder = payload.orderItems.reduce((sum, it) => sum + Number(it.total || it.subtotal || 0), 0);
                const totalPayments = payload.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

                const change = totalPayments - totalOrder;

                // const newCashPayment = payload.payments?.find(p => p.payment_method === 'CASH');

                // const newCashAmount = newCashPayment?.amount ? Number(newCashPayment.amount - change).toFixed(2) : 0;

                // const cashPayment: Partial<Payment> = {
                //     ...newCashPayment,
                //     amount: Number(newCashAmount),
                // };

                adaptedPayments = adaptedPayments.map(p => {
                    if (p.payment_method !== "CASH") return p;

                    return {
                        ...p,
                        amount: Number((Number(p.amount || 0) - change).toFixed(2)),
                    };
                });

            } else {
                // NOTE No da cambio por lo tanto agrega el exedente a OVERPAYMENT

                const onCreditAmount = adaptedPayments.find((p) => p.payment_method === 'ON_CREDIT')?.amount || 0;

                if (onCreditAmount > 0) {
                    throw new Error("No se puede crear con saldo a favor en el cliente si un metodo de pago es en cuenta corriente")
                }


                const totalOrder = payload.orderItems.reduce((sum, it) => sum + Number(it.total || it.subtotal || 0), 0);
                const totalPayments = payload.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

                const change = totalPayments - totalOrder;

                const overPaymentMethod = {
                    order_id: payload.order.order_id,
                    payment_method: 'OVERPAYMENT',
                    amount: Number(change.toFixed(2)),
                    payment_direction: "IN",
                    payment_type: "ORDER"
                };

                adaptedPayments.push(overPaymentMethod as Payment);


            }

            // const a = adaptedPayments.find(p => p.payment_method === 'ON_CREDIT');
            // const b = adaptedPayments.find(p => p.payment_method === 'CASH');
            // const c = adaptedPayments.find(p => p.payment_method === 'OVERPAYMENT');

            console.log("Adapted payments before createOrder:", adaptedPayments);

            return await createOrder(payload.order, payload.orderItems, adaptedPayments);
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Orden creada:", data)
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Orden creada con éxito")

            const printContent = {
                order: order,
                orderItems: orderItems
            };

            if (checkOutOptions.printTicket) {
                handlePrintTicket(printContent);
            }

            // Clear AI order context
            clearAiOrder();
            resetAfterOrderCreation();
        },
        onError: (e) => {
            console.error("Error al crear la orden", e)
            toast.error("Error al crear la orden: " + (e instanceof Error ? e.message : "Error desconocido"))
        },
    })

    const handleCreateOrder = async (payments: Omit<Payment, 'payment_id' | 'created_at' | 'selected'>[]) => {
        try {
            await createOrderMutation.mutateAsync({ order, orderItems, payments })
        } catch (e) {
            console.error("Error al crear la orden", e)
        }
    }


    const isDelivery = order.order_type === 'DELIVERY';

    const filteredOrderItems = orderItems.filter(it => it.order_id === order.order_id).sort((a, b) => {
        if (!isDelivery) return 0; // no tocar el orden si no es delivery

        return a.product_name.localeCompare(b.product_name, 'es', {
            sensitivity: 'base',
        });
    });

    // const formattedOrderItems 
    const orderTotal = filteredOrderItems.reduce((sum, it) => sum + Number(it.total || it.subtotal || 0), 0)

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col  ">
            <h3 className="mb-2 text-base font-semibold text-foreground">{isDelivery ? "Pedido" : "Orden de compra"}</h3>
            {filteredOrderItems.length === 0 ? (
                <EmptyCart />
            ) : (
                <ul className="space-y-1  overflow-auto max-h-[calc(100vh-330px)]">
                    {filteredOrderItems.map((it, idx) => (
                        <li key={idx} className="flex items-center justify-between  text-sm h-9">
                            <div className="flex items-center gap-1.5">
                                <span className={`${it.status !== 'CANCELLED' ? '' : 'line-through'}`}>
                                    {it.product_name} {it.product_presentation_name} x {it.quantity + it.over_sell_quantity}
                                </span>
                                {it.is_ai_assisted && (
                                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                        <Sparkles className="w-3 h-3" />
                                    </Badge>
                                )}
                            </div>
                            <span className={`ml-auto  ${it.status !== 'CANCELLED' ? 'mr-1' : 'mr-3'}`}>${Number(it.total ?? it.subtotal ?? 0).toFixed(2)}</span>
                            {it.status !== 'CANCELLED' && (
                                <DeleteCartItemButton itemData={it} />
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-auto flex justify-between border-t pt-2 text-sm text-foreground">
                <span>Total</span>
                <span className="font-semibold">${orderTotal.toFixed(2)}</span>
            </div>

            <div className="mt-3 flex justify-end gap-2">
                <DeleteOrderBtn orderId={order?.order_id} />
                <CheckoutOrder
                    onConfirm={handleCreateOrder}
                    isLoading={createOrderMutation.isPending}
                    order={order}
                    onChangeOrder={onChangeOrder}
                    hasClient={order?.client_id ? true : false}
                    checkOutOptions={checkOutOptions}
                    onChangeOptions={setCheckOutOptions}
                />
            </div>


        </div>
    )
}

export default Cart