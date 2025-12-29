import Cart from "@/pages/selling/components/cart"
import ScaleDataDisplay from "@/pages/selling/components/scaleDataDisplay"
import SellingPointProductSelector from "@/pages/selling/components/sellingPointProductSelector"
import ClientInformation from "@/pages/selling/components/clientInformation"
import { CancelClientSelection, ClientSelectorRoot, CreateClient, SelectClient } from "@/components/shared/selectors/clientSelector"
import { Label } from "@/components/ui/label"
import { OrderT } from "@/types/orders"

const Order = ({ order, onChangeOrder }: {
    order: OrderT,
    onChangeOrder: (order: OrderT) => void
}) => {

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
                        >
                            <SelectClient />
                            <CancelClientSelection />
                            <CreateClient />
                        </ClientSelectorRoot>
                    </div>

                    {order?.client && (
                        <ClientInformation selectedClient={order?.client} />
                    )}

                    <SellingPointProductSelector />

                </div>

                <ScaleDataDisplay order={order} />

            </div>
            <Cart order={order} onChangeOrder={onChangeOrder} />
        </div>

    )
}

export default Order