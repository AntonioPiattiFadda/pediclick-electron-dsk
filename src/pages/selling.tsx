import ScaleDataDisplay from "@/components/sellingPoint/scaleDataDisplay"
import SellingPointProductSelector from "@/components/sellingPoint/sellingPointProductSelector"
import { ScaleProvider } from "@/context/ScaleContext"
import { useOrderContext } from "@/context/OrderContext"
import CheckoutOrder from "@/components/checkoutOrder/CheckoutOrder"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createOrder } from "@/service/orders"
import { useAppSelector } from "@/hooks/useUserData"

const Selling = () => {
    const { orderItems, order } = useOrderContext()
    console.log(orderItems)
    const orderTotal = orderItems.reduce((sum, it) => sum + Number(it.total_price || it.subtotal || 0), 0)

    const queryClient = useQueryClient();

    type CreateOrderPayload = { order: typeof order; orderItems: typeof orderItems };

    const { role } = useAppSelector((state) => state.user);

    const createOrderMutation = useMutation({
        mutationFn: async (payload: CreateOrderPayload) => {
            const res = await createOrder(payload, role)
            return res.data
        },
        onSuccess: (data) => {
            if (import.meta.env.DEV) console.log("Orden creada:", data.order_id)
            queryClient.invalidateQueries({ queryKey: ["orders"] })
        },
        onError: (e) => {
            console.error("Error al crear la orden", e)
        },
    })

    const handleCreateOrder = async () => {
        try {
            await createOrderMutation.mutateAsync({ order, orderItems })
        } catch (e) {
            console.error("Error al crear la orden", e)
        }
    }


    return (
        <ScaleProvider>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <SellingPointProductSelector />
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <h3 className="mb-2 text-base font-semibold text-foreground">Orden de compra</h3>
                    {orderItems.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Sin items aún.</div>
                    ) : (
                        <ul className="space-y-2 max-h-64 overflow-auto">
                            {orderItems.map((it, idx) => (
                                <li key={idx} className="flex items-center justify-between py-1.5 text-sm">
                                    <span>{it.product_name} x {it.quantity}</span>
                                    <span>${Number(it.total_price ?? it.subtotal ?? 0).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-2 flex justify-between border-t pt-2 text-sm text-foreground">
                        <span>Total</span>
                        <span className="font-semibold">${orderTotal.toFixed(2)}</span>
                    </div>

                    <div className="mt-3 flex justify-end">
                        <CheckoutOrder
                            onConfirm={handleCreateOrder}
                            isLoading={createOrderMutation.isPending}
                        />
                    </div>
                </div>
                <ScaleDataDisplay />
            </div>
        </ScaleProvider >
    )
}

export default Selling