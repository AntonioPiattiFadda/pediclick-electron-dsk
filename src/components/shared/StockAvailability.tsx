import { StockBreakdownDialog } from "@/components/shared/StockBreakdownDialog";
import { toPresentation } from "@/utils";
import type { UseProductStockReturn } from "@/hooks/useProductStock";

const StockAvailability = ({
    productId,
    remainingBaseUnitsForLot,
    bulk_quantity_equivalence,
    stockData,
}: {
    productId: number;
    remainingBaseUnitsForLot: number;
    bulk_quantity_equivalence: number | null;
    stockData: UseProductStockReturn;
}) => {
    const remainingInPres = toPresentation(remainingBaseUnitsForLot, bulk_quantity_equivalence);

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
                className={`text-base font-semibold ${remainingInPres > 0 ? "text-green-600" : "text-amber-600"}`}
            >
                {remainingInPres}
            </span>
        </div>
    );
};

export default StockAvailability;
