import { useCreateOrder } from "../../hooks/useCreateOrder";

export function CreateOrderBtn() {
  const createOrder = useCreateOrder();

  const handleClick = () => {
    createOrder.mutate({
      provider_id: 2,
      notes: "Compra semanal de verduras",
      order_items: [
        { product_id: 10, lot_id: 5, quantity: 20, unit_price: 100 },
        { product_id: 12, lot_id: 6, quantity: 10, unit_price: 250 },
      ],
    });
  };

  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded"
      onClick={handleClick}
      disabled={createOrder.isPending}
    >
      {createOrder.isPending ? "Creando..." : "Crear Orden"}
    </button>
  );
}
