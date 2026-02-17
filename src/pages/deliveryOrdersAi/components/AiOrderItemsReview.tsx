import { OrderItem } from "@/types/orderItems";
import { AiOrderItemRow } from "./AiOrderItemRow";

interface AiOrderItemsReviewProps {
  items: OrderItem[];
  onUpdateItem: (index: number, updatedItem: OrderItem) => void;
  onRemoveItem: (index: number) => void;
}

export function AiOrderItemsReview({
  items,
  onUpdateItem,
  onRemoveItem,
}: AiOrderItemsReviewProps) {
  const totalAmount = items && items.reduce(
    (sum, item) => sum + (item.total || item.subtotal || 0),
    0
  );

  const canRemoveItems = items.length > 1;

  return (
    <div className="flex flex-col gap-4 w-fit">
      <div className="flex flex-col gap-2">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1.5fr_100px_120px_120px_80px] gap-2 px-2 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
          <div>Producto</div>
          <div>Presentación</div>
          <div className="text-center">Cantidad</div>
          <div className="text-center">Precio</div>
          <div className="text-right">Total</div>
          <div className="text-right">Acciones</div>
        </div>

        {/* Items List */}
        <div className="flex flex-col max-h-[400px] overflow-y-auto pb-[350px]">
          {items.map((item, index) => (
            <AiOrderItemRow
              key={index}
              item={item}
              onUpdate={(updatedItem) => onUpdateItem(index, updatedItem)}
              onRemove={() => onRemoveItem(index)}
              canRemove={canRemoveItems}
            />
          ))}
        </div>
      </div>

      {/* Total Summary */}
      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-lg font-semibold">Total estimado:</span>
        <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
