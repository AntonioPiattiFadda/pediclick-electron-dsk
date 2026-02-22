import {
  CancelClientSelection,
  ClientSelectorRoot,
  CreateClient,
  SelectClient,
} from "@/components/shared/selectors/clientSelector";
import { Label } from "@/components/ui/label";
import { OrderT } from "@/types/orders";
import { ProductSelectorDeliveryOrder } from "./components/ProductSelectorDeliveryOrder";
import { DeliveryCart } from "./components/DeliveryCart";
import { PricingPanel } from "./components/PricingPanel";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores/store";
import { updateDeliveryOrderClient } from "@/service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const DeliveryOrder = ({
  order,
  onChangeOrder,
}: {
  order: OrderT;
  onChangeOrder: (order: OrderT) => void;
}) => {
  const activeDeliveryOrderId = useSelector(
    (state: RootState) => state.deliveryOrder.activeDeliveryOrderId
  );
  const queryClient = useQueryClient();

  const updateClientMutation = useMutation({
    mutationFn: (clientId: number | null) => {
      if (!activeDeliveryOrderId) throw new Error("No active delivery order");
      toast.loading("Actualizando cliente...");
      return updateDeliveryOrderClient(activeDeliveryOrderId, clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["delivery-order", activeDeliveryOrderId],
      });
      toast.dismiss();
    },
    onError: (error) => {
      console.error("Error updating client:", error);
      toast.dismiss();
      toast.error("Error al actualizar cliente");
    },
  });

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
                await updateClientMutation.mutateAsync(clientId);
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

          <ProductSelectorDeliveryOrder />
        </div>

        <PricingPanel order={order} />
      </div>
      <DeliveryCart order={order} />
    </div>
  );
};

export default DeliveryOrder;
