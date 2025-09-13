import { useOrderContext } from "../../context/OrderContext";

const Order = () => {
  const { order, orderItems } = useOrderContext();
  return (
    <div>
      <h2>Order Details</h2>
      <span>{order?.order_number}</span>
      <h3>Order Items</h3>
      {orderItems.map((item, index) => (
        <div key={index}>
          Item {index + 1}: ${item.unit_price} - Subtotal: ${item.subtotal}
        </div>
      ))}
      {/* <CreateOrderBtn /> */}
    </div>
  );
};

export default Order;
