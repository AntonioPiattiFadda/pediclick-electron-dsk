import {
  CancelClientSelection,
  ClientSelectorRoot,
  CreateClient,
  SelectClient,
} from "@/components/shared/selectors/clientSelector";
import { Label } from "@/components/ui/label";
import { OrderT } from "@/types/orders";
import { DeliveryProductSelector } from "./components/DeliveryProductSelector";
import { DeliveryScaleDataDisplay } from "./components/DeliveryScaleDataDisplay";
import { DeliveryCart } from "./components/DeliveryCart";
import { useDeliveryOrderContext } from "@/context/DeliveryOrderContext";

const DeliveryOrder = ({
  order,
  onChangeOrder,
}: {
  order: OrderT;
  onChangeOrder: (order: OrderT) => void;
}) => {
  const { updateOrderClient } = useDeliveryOrderContext();

  return (
    <div className="grid grid-cols-[1fr_1fr] space-x-4 p-4 h-[calc(100vh-7rem)] -mt-2">
      <div className="flex flex-col space-y-6 h-full relative ">
        <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col space-y-4 ">
          <div className="flex flex-col gap-1">
            <Label>Cliente:</Label>
            <ClientSelectorRoot
              value={order.client || null}
              onChange={async (v) => {
                const clientId = v ? Number(v.client_id) : null;
                await updateOrderClient(clientId);
                // Update local order object for immediate UI feedback
                onChangeOrder({
                  ...order,
                  client_id: clientId,
                  client: v,
                });
              }}
              showInfo={true}
            >
              <SelectClient />
              <CancelClientSelection />
              <CreateClient />
            </ClientSelectorRoot>
          </div>

          <DeliveryProductSelector />
        </div>

        <DeliveryScaleDataDisplay order={order} />
      </div>
      <DeliveryCart order={order} />
    </div>
  );
};

export default DeliveryOrder;
