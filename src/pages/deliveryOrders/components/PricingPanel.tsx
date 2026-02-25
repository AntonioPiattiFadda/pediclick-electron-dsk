import SharedPricingPanel from "@/components/shared/PricingPanel";
import { addDeliveryOrderItem, getDeliveryOrderItems } from "@/service";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/stores/store";

export const PricingPanel = ({ order }: { order: OrderT }) => {
    const selectedProduct = useSelector((state: RootState) => state.deliveryOrder.selectedProduct);
    const productPresentation = useSelector((state: RootState) => state.deliveryOrder.productPresentation);
    const isCheckOutOpen = useSelector((state: RootState) => state.deliveryOrder.isCheckOutOpen);

    const queryClient = useQueryClient();

    const { data: orderItems = [] } = useQuery({
        queryKey: ["delivery-order-items", order.order_id],
        queryFn: async () => getDeliveryOrderItems(order.order_id!),
        enabled: !!order.order_id,
        refetchOnWindowFocus: true,
    });

    const addItemMutation = useMutation({
        mutationFn: async (itemData: Omit<OrderItem, "order_item_id">) => {
            if (!order.order_id) throw new Error("No active delivery order");
            return addDeliveryOrderItem(order.order_id, itemData as OrderItem);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["delivery-order-items", order.order_id] });
        },
    });

    const handleAddItems = async (items: OrderItem[]) => {
        for (const item of items) {
            const itemToAdd: Omit<OrderItem, "order_item_id"> = {
                product_id: item.product_id,
                product_name: item.product_name,
                product_presentation_id: item.product_presentation_id,
                product_presentation_name: item.product_presentation_name,
                quantity: item.quantity,
                qty_in_base_units: item.qty_in_base_units,
                over_sell_quantity: item.over_sell_quantity || 0,
                price: item.price,
                subtotal: item.subtotal,
                total: item.total,
                stock_id: item.stock_id,
                lot_id: item.lot_id,
                status: "PENDING",
                logic_type: item.logic_type,
                order_id: item.order_id,
                location_id: item.location_id,
                is_deleted: item.is_deleted,
                created_at: item.created_at,
            };
            await addItemMutation.mutateAsync(itemToAdd);
        }
    };

    return (
        <SharedPricingPanel
            order={order}
            selectedProduct={selectedProduct}
            productPresentation={productPresentation}
            isCheckOutOpen={isCheckOutOpen}
            orderItems={orderItems}
            onAddItems={handleAddItems}
        />
    );
};
