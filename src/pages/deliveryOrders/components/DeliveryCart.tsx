import { Button } from "@/components/ui/button";
import { useDeliveryOrderContext } from "@/context/DeliveryOrderContext";
import { getDeliveryOrderItems } from "@/service";
import { OrderT } from "@/types/orders";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { EmptyCart } from "../../inSiteOrders/components/EmptyCart";
import { DeliveryCheckout } from "./DeliveryCheckout";
import { MarkAsDeliveredButton } from "./MarkAsDelivered";
import { MarkAsDeliveringButton } from "./MarkAsDeliveringButton";

// const [isLoading, setIsLoading] = useState(true);
// const [isError, setIsError] = useState(false);
// const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

// const fetchOrderItems = async () => {
//   try {
//     setIsLoading(true);
//     const items = await getDeliveryOrderItems(order.order_id);
//     console.log("Fetched order items:", items);
//     setIsLoading(false);
//     setIsError(false);
//     setOrderItems(items);
//   } catch (error) {
//     console.error("Error fetching order items:", error);
//     setIsError(true);
//     setIsLoading(false);
//     setOrderItems([]);
//   }
// };

// useEffect(() => {
//   fetchOrderItems();
// }, [order.order_id]);

export const DeliveryCart = ({
  order,
}: {
  order: OrderT;
}) => {
  const { removeItemFromOrder, isRemovingItem } = useDeliveryOrderContext();
  const queryClient = useQueryClient();

  // Clear stale cache on mount (one-time fix for format change)
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["delivery-order-items", order.order_id],
    });
  }, [order.order_id, queryClient]);

  // Fetch order items from database
  const { data: orderItems = [], isLoading, isError } = useQuery({
    queryKey: ["delivery-order-items", order.order_id],
    queryFn: async () => getDeliveryOrderItems(order.order_id!),
    enabled: !!order.order_id,
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const filteredOrderItems = orderItems.sort((a, b) => {
    if (!a?.product_name || !b?.product_name) return 0; // Keep original order if product names are missing
    return a?.product_name.localeCompare(b?.product_name, "es", {
      sensitivity: "base",
    });
  });

  const orderTotal = filteredOrderItems.reduce(
    (sum, it) => sum + Number(it.total || it.subtotal || 0),
    0
  );


  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col">
        <h3 className="mb-2 text-base font-semibold text-foreground">
          Pedido
        </h3>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col">
        <h3 className="mb-2 text-base font-semibold text-foreground">
          Pedido
        </h3>
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">Error al cargar los items del pedido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm h-full flex flex-col  ">
      <h3 className="mb-2 text-base font-semibold text-foreground">
        Pedido
      </h3>
      {filteredOrderItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <ul className="space-y-1  overflow-auto max-h-[calc(100vh-330px)]">
          {filteredOrderItems.map((it, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between  text-sm h-9"
            >
              <span
                className={`${it.status !== "CANCELLED" ? "" : "line-through"}`}
              >
                {it?.product_name} {it?.product_presentation_name} x{" "}
                {it.quantity + it.over_sell_quantity}
              </span>
              <span
                className={`ml-auto  ${it.status !== "CANCELLED" ? "mr-1" : "mr-3"
                  }`}
              >
                ${Number(it.total ?? it.subtotal ?? 0).toFixed(2)}
              </span>

              {it.status !== "CANCELLED" && (
                <button
                  disabled={isRemovingItem}
                  onClick={() => removeItemFromOrder({
                    orderItemId: it.order_item_id!,
                    stockId: it.stock_id!,
                  })}
                  className="text-red-500 hover:text-red-700 ml-1"
                  title="Eliminar producto"
                >
                  ×
                </button>
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
        {/* <DeleteOrderBtn orderId={order?.order_id} /> */}
        <MarkAsDeliveringButton order={order} />
        <MarkAsDeliveredButton order={order} />

        {order.payment_status === "PAID" ? (
          <>

            <Button
              className="text-green-600 bg-transparent"
              disabled
              variant="default"
            >
              Pagada
            </Button>
          </>
        ) : (<DeliveryCheckout
          order={order}
          hasClient={order?.client_id ? true : false}
        />)
        }

      </div>
    </div>
  );
};
