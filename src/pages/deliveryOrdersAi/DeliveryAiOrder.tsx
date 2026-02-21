import { CancelClientSelection, ClientSelectorRoot, CreateClient, SelectClient } from "@/components/shared/selectors/clientSelector"
import { Label } from "@/components/ui/label"
import Cart from "@/components/shared/Cart"
import { OrderT } from "@/types/orders"
import { useOrderContext } from "@/context/OrderContext"
import { useDeliveryOrderAiContext } from "@/context/DeliveryOrderAiContext"
import ProductSelectorDeliveryOrderAi from "./components/ProductSelectorDeliveryOrderAi"
import { DeleteOrderBtn } from "./components/deleteOrderBtn"
import PricingPanel from "./components/PricingPanel"

const DeliveryAiOrder = ({ order, onChangeOrder }: {
    order: OrderT,
    onChangeOrder: (order: OrderT) => void
}) => {

    const { resetAfterOrderCreation } = useOrderContext()
    const { orderItems, setOrderItems, clearAiOrder } = useDeliveryOrderAiContext()

    const handleAfterCreate = () => {
        clearAiOrder();
        resetAfterOrderCreation();
    }

    return (
        <div className="grid grid-cols-[1fr_1fr] space-x-4 p-4 h-[calc(100vh-7rem)] -mt-2">
            <div className="flex flex-col space-y-6 h-full relative ">
                <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col space-y-4 ">
                    <div className="flex flex-col gap-1">
                        <Label>
                            Cliente:
                        </Label>
                        <ClientSelectorRoot
                            value={order.client || null}
                            onChange={v => {
                                onChangeOrder({ ...order, client_id: v ? Number(v.client_id) : null, client: v });
                            }}
                            showInfo={true}
                        >
                            <SelectClient />
                            <CancelClientSelection />
                            <CreateClient />
                        </ClientSelectorRoot>
                    </div>



                    <ProductSelectorDeliveryOrderAi />

                </div>

                <PricingPanel order={order} />

            </div>
            <Cart
                order={order}
                onChangeOrder={onChangeOrder}
                orderItems={orderItems}
                setOrderItems={setOrderItems}
                onAfterCreate={handleAfterCreate}
                deleteOrderBtn={<DeleteOrderBtn orderId={order?.order_id} />}
            />
        </div>

    )
}

export default DeliveryAiOrder
