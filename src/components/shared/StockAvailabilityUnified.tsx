import { StockBreakdownDialog } from "@/components/shared/StockBreakdownDialog";
import type { UseProductStockReturn } from "@/hooks/useProductStock";

const StockAvailabilityUnified = ({
    productId,
    availablePresentationUnits,
    stockData,
}: {
    productId: number;
    availablePresentationUnits: number;
    stockData: UseProductStockReturn;
}) => {
    return (
        <div className="flex flex-col gap-1 mt-1">
            <div className="flex gap-1 items-center justify-center">
                <span className="text-xs text-slate-500">Stock disponible</span>
                <StockBreakdownDialog
                    productId={productId}
                    stockData={stockData}
                />
            </div>
            <span
                className={`text-base font-semibold ${availablePresentationUnits > 0 ? "text-green-600" : "text-amber-600"}`}
            >
                {availablePresentationUnits}
            </span>
        </div>
    );
};

export default StockAvailabilityUnified;
