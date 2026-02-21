import SharedPricingPanel from "@/components/shared/PricingPanel";
import { useOrderContext } from "@/context/OrderContext";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";

const PricingPanel = ({ order }: { order: OrderT }) => {
    const {
        setOrderItems,
        orderItems,
        selectedProduct,
        productPresentation,
        isCheckOutOpen,
    } = useOrderContext();

    return (
        <SharedPricingPanel
            order={order}
            selectedProduct={selectedProduct}
            productPresentation={productPresentation}
            isCheckOutOpen={isCheckOutOpen}
            orderItems={orderItems}
            onAddItems={(items: OrderItem[]) => setOrderItems((prev) => [...prev, ...items])}
        />
    );
};

export default PricingPanel;
