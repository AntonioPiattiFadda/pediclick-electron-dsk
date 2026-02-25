import { StockBreakdownDialog } from "@/components/shared/StockBreakdownDialog";

const StockAvailabilityUnified = ({
    unifyedStock,
    remainingInPresentationUnits,
    productId,
}: {
    unifyedStock: {
        quantity: number;
        reserved_for_transferring_quantity: number;
        reserved_for_selling_quantity: number;
    };
    remainingInPresentationUnits: number;
    productId: number;
}) => {
    return (
        <div className="flex flex-col gap-1 mt-1">
            <div className="flex gap-1 items-center justify-center">
                <span className="text-xs text-slate-500">Stock disponible</span>
                <StockBreakdownDialog
                    productId={productId}
                    totalBaseUnits={unifyedStock?.quantity ?? 0}
                    reservedForSelling={unifyedStock?.reserved_for_selling_quantity ?? 0}
                    reservedForTransferring={unifyedStock?.reserved_for_transferring_quantity ?? 0}
                />
            </div>
            <span
                className={`text-base font-semibold ${remainingInPresentationUnits > 0 ? "text-green-600" : "text-amber-600"}`}
            >
                {Number(remainingInPresentationUnits)}
            </span>
        </div>
    );
};

export default StockAvailabilityUnified;
