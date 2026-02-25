import { Stock } from "@/types/stocks";
import { StockBreakdownDialog } from "@/components/shared/StockBreakdownDialog";
import { toPresentation } from "@/utils";

const StockAvailability = ({
    selectedStock,
    remainingStock,
    bulk_quantity_equivalence,
    productId,
}: {
    selectedStock: Stock;
    remainingStock: number;
    bulk_quantity_equivalence: number | null;
    productId: number;
}) => {
    const remainingInPres = toPresentation(remainingStock, bulk_quantity_equivalence);

    return (
        <div className="flex flex-col gap-1 mt-1">
            <div className="flex gap-1 items-center justify-center">
                <span className="text-xs text-slate-500">Stock disponible</span>
                <StockBreakdownDialog
                    productId={productId}
                    totalBaseUnits={selectedStock?.quantity ?? 0}
                    reservedForSelling={selectedStock?.reserved_for_selling_quantity ?? 0}
                    reservedForTransferring={selectedStock?.reserved_for_transferring_quantity ?? 0}
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
