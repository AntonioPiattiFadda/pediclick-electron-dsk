import SharedPricingPanel from "@/components/shared/PricingPanel";
import { useDeliveryOrderContext } from "@/context/DeliveryOrderContext";
import { getDeliveryOrderItems } from "@/service";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";
import { useQuery } from "@tanstack/react-query";

export const PricingPanel = ({ order }: { order: OrderT }) => {
    const {
        selectedProduct,
        productPresentation,
        isCheckOutOpen,
        addItemToOrder,
    } = useDeliveryOrderContext();

    const { data: orderItems = [] } = useQuery({
        queryKey: ["delivery-order-items", order.order_id],
        queryFn: async () => getDeliveryOrderItems(order.order_id!),
        enabled: !!order.order_id,
        refetchOnWindowFocus: true,
    });

    const handleAddItems = async (items: OrderItem[]) => {
        for (const item of items) {
            const itemToAdd: Omit<OrderItem, "order_item_id"> = {
                product_id: item.product_id,
                product_name: item.product_name,
                product_presentation_id: item.product_presentation_id,
                product_presentation_name: item.product_presentation_name,
                quantity: item.quantity,
                over_sell_quantity: item.over_sell_quantity || 0,
                price: item.price,
                subtotal: item.subtotal,
                total: item.total,
                stock_id: item.stock_id,
                lot_id: item.lot_id,
                status: "PENDING",
                price_type: item.price_type,
                logic_type: item.logic_type,
                order_id: item.order_id,
                location_id: item.location_id,
                is_deleted: item.is_deleted,
                created_at: item.created_at,
            };
            await addItemToOrder(itemToAdd);
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
