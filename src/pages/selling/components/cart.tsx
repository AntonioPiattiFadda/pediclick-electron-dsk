import { useOrderContext } from '@/context/OrderContext'
import { createOrder } from '@/service/orders'
import { OrderPayment } from '@/types/orderPayments'
import { OrderT } from '@/types/orders'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import CheckoutOrder from './checkoutOrder'
import { DeleteCartItemButton } from './deleteCartItemButton'
import { DeleteOrderBtn } from './deleteOrderBtn'
import { EmptyCart } from './EmptyCart'
import usePrinter from '@/hooks/usePrinter'
import { PrintTicketPayload } from '@/types/printer'
import { useGetLocationData } from '@/hooks/useGetLocationData'
import { useState } from 'react'
import { CheckOutOptions } from '@/types'

const Cart = ({ order, onChangeOrder }: {
    order: OrderT,
    onChangeOrder: (order: OrderT) => void
}) => {

    const { orderItems, setOrderItems, setOrders, orders, setactiveOrder, resetAfterOrderCreation } = useOrderContext()

    const queryClient = useQueryClient();

    const { handlePrintTicket } = usePrinter();

    const { handleGetLocationId, handleGetLocation } = useGetLocationData();

    const [checkOutOptions, setCheckOutOptions] = useState<CheckOutOptions>({
        printTicket: false,
        registerPositiveCredit: false,
    });

    type CreateOrderPayload = { order: typeof order; orderItems: typeof orderItems, orderPayments?: Partial<OrderPayment>[] };

    const createOrderMutation = useMutation({
        mutationFn: async (payload: CreateOrderPayload) => {
            let adaptedPayments = payload.orderPayments ?? []


            // NOTE Se da cambio por lo tanto se saca del cash el excedente
            if (!checkOutOptions.registerPositiveCredit) {

                //Formatt el payment en efectivo para que el monto total sea igual al total de la orden

                const totalOrder = payload.orderItems.reduce((sum, it) => sum + Number(it.total || it.subtotal || 0), 0);
                const totalPayments = payload.orderPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

                const change = totalPayments - totalOrder;

                // const newCashPayment = payload.orderPayments?.find(p => p.payment_method === 'CASH');

                // const newCashAmount = newCashPayment?.amount ? Number(newCashPayment.amount - change).toFixed(2) : 0;

                // const cashPayment: Partial<OrderPayment> = {
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
                const totalPayments = payload.orderPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

                const change = totalPayments - totalOrder;

                const overPaymentMethod = {
                    order_id: payload.order.order_id,
                    payment_method: 'OVERPAYMENT',
                    amount: Number(change.toFixed(2))
                };

                adaptedPayments.push(overPaymentMethod as Partial<OrderPayment>);


            }

            const a = adaptedPayments.find(p => p.payment_method === 'ON_CREDIT');
            console.log("a", a);
            const b = adaptedPayments.find(p => p.payment_method === 'CASH');
            console.log("b", b);
            const c = adaptedPayments.find(p => p.payment_method === 'OVERPAYMENT');
            console.log("c", c);

            console.log("Adapted payments before createOrder:", adaptedPayments);

            return await createOrder(payload.order, payload.orderItems, adaptedPayments);
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Orden creada:", data)
            queryClient.invalidateQueries({ queryKey: ["orders"] })
            toast.success("Orden creada con éxito")

            console.log("Order created:", orders)
            console.log("Order created:", orderItems)

            const filteredOrders = orders.filter((o: OrderT) => o.order_id !== order.order_id);
            const filteredOrderItems = orderItems.filter(it => it.order_id !== order.order_id);
            console.log("Filtered orders after creation:", filteredOrders);
            console.log("Filtered orders after creation:", filteredOrderItems);

            const orderToPrint = orders.filter((o: OrderT) => o.order_id === order.order_id);
            console.log("Order to print:", orderToPrint);
            const orderItemsToPrint = orderItems.filter(it => it.order_id === order.order_id);

            const printContent: PrintTicketPayload = {
                user: null,
                location: {
                    location_id: handleGetLocationId(),
                    name: handleGetLocation()?.name,
                    address: handleGetLocation()?.address,
                    type: 'STORE',
                    created_at: '',
                    deleted_at: null,
                },
                order: orderToPrint[0],
                orderItems: orderItemsToPrint
            };

            if (checkOutOptions.printTicket) {
                alert("Imprimiendo ticket...");
                handlePrintTicket(printContent);
            }


            setOrders(filteredOrders)
            setactiveOrder(filteredOrders[0]?.order_id.toString() || "");
            setOrderItems(filteredOrderItems)
            resetAfterOrderCreation();
        },
        onError: (e) => {
            console.error("Error al crear la orden", e)
            toast.error("Error al crear la orden: " + (e instanceof Error ? e.message : "Error desconocido"))
        },
    })

    const handleCreateOrder = async (orderPayments: Partial<OrderPayment>[]) => {
        try {
            await createOrderMutation.mutateAsync({ order, orderItems, orderPayments })
        } catch (e) {
            console.error("Error al crear la orden", e)
        }
    }

    const filteredOrderItems = orderItems.filter(it => it.order_id === order.order_id);
    const orderTotal = filteredOrderItems.reduce((sum, it) => sum + Number(it.total || it.subtotal || 0), 0)

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col  ">
            <h3 className="mb-2 text-base font-semibold text-foreground">Orden de compra</h3>
            {filteredOrderItems.length === 0 ? (
                <EmptyCart />
            ) : (
                <ul className="space-y-1  overflow-auto max-h-[calc(100vh-330px)]">
                    {filteredOrderItems.map((it, idx) => (
                        <li key={idx} className="flex items-center justify-between  text-sm h-9">
                            <span>{it.product_name} {it.product_presentation_name} x {it.quantity}</span>
                            <span className='ml-auto'>${Number(it.total ?? it.subtotal ?? 0).toFixed(2)}</span>
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