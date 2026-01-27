import { CancelClientSelection, ClientSelectorRoot, CreateClient, SelectClient } from "@/components/shared/selectors/clientSelector"
import { Label } from "@/components/ui/label"
import { OrderT } from "@/types/orders"
import SellingPointProductSelector from "./components/sellingPointProductSelector"
import ScaleDataDisplay from "./components/scaleDataDisplay"
import Cart from "./components/cart"

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
                            showInfo={true}
                        >
                            <SelectClient />
                            <CancelClientSelection />
                            <CreateClient />
                        </ClientSelectorRoot>
                    </div>



                    <SellingPointProductSelector />

                </div>

                <ScaleDataDisplay order={order} />

            </div>
            <Cart order={order} onChangeOrder={onChangeOrder} />
        </div>

    )
}

export default Order