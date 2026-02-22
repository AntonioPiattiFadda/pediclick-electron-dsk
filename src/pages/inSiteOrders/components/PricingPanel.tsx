import SharedPricingPanel from "@/components/shared/PricingPanel";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/stores/store";
import { setOrderItems } from "@/stores/orderSlice";
import { OrderItem } from "@/types/orderItems";
import { OrderT } from "@/types/orders";

const PricingPanel = ({ order }: { order: OrderT }) => {
    const dispatch = useDispatch<AppDispatch>();
    const orderItems = useSelector((state: RootState) => state.order.orderItems);
    const selectedProduct = useSelector((state: RootState) => state.order.selectedProduct);
    const productPresentation = useSelector((state: RootState) => state.order.productPresentation);
    const isCheckOutOpen = useSelector((state: RootState) => state.order.isCheckOutOpen);

    return (
        <SharedPricingPanel
            order={order}
            selectedProduct={selectedProduct}
            productPresentation={productPresentation}
            isCheckOutOpen={isCheckOutOpen}
            orderItems={orderItems}
            onAddItems={(items: OrderItem[]) => dispatch(setOrderItems([...orderItems, ...items]))}
        />
    );
};

export default PricingPanel;
