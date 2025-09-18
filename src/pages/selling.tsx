import ScaleDataDisplay from "@/components/sellingPoint/scaleDataDisplay"
import SellingPointProductSelector from "@/components/sellingPoint/sellingPointProductSelector"
import { ScaleProvider } from "@/context/ScaleContext"
import { useOrderContext } from "@/context/OrderContext"
import CheckoutOrder from "@/components/checkoutOrder/CheckoutOrder"
import { useCreateOrder } from "@/hooks/useCreateOrder"

const Selling = () => {
    const { orderItems } = useOrderContext()
    const createOrder = useCreateOrder()
    console.log(orderItems)
    const orderTotal = orderItems.reduce((sum, it) => sum + Number(it.total_price || it.subtotal || 0), 0)



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
                            onConfirm={async (payload) => {
                                const order_items = payload.items.map((it) => ({
                                    product_id: it.product_id,
                                    quantity: it.quantity,
                                    unit_price: it.unit_price,
                                }))
                                try {
                                    await createOrder.mutateAsync({
                                        provider_id: null,
                                        notes: `Cliente: ${payload.client_name ?? ""} (${payload.client_id ?? "-"}) | Fecha: ${payload.date}${payload.notes ? " | Notas: " + payload.notes : ""}`,
                                        order_items,
                                    })
                                    // TODO: integrar servicio de ticket en src/service cuando lo agregues.
                                } catch (e) {
                                    console.error("Error al crear la orden", e)
                                }
                            }}
                        />
                    </div>
                </div>
                <ScaleDataDisplay />
            </div>
        </ScaleProvider>
    )
}

export default Selling