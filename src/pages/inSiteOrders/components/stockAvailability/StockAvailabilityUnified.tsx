import { StockData } from "../stockData";

const StockAvailabilityUnified = ({ unifyedStock, remainingUnifyedStock }: {
    unifyedStock: {
        quantity: number;
        reserved_for_transferring_quantity: number;
        reserved_for_selling_quantity: number;
    },
    remainingUnifyedStock: number
}) => {
    return (
        <div className="flex flex-col gap-1 mt-1">

            <div className="flex gap-1 items-center justify-center">
                <span className="text-xs text-slate-500">Stock disponible</span>
                <StockData stock={{
                    quantity: unifyedStock?.quantity,
                    reserved_for_transferring_quantity: unifyedStock?.reserved_for_transferring_quantity,
                    reserved_for_selling_quantity: unifyedStock?.reserved_for_selling_quantity,
                    location_id: null,
                    lot_id: null,
                    min_notification: null,
                    max_notification: null,
                    stock_type: "STORE",
                    updated_at: null,
                    transformed_from_product_id: null,
                }} />
            </div>
            <span
                className={`text-base font-semibold ${remainingUnifyedStock > 0 ? "text-green-600" : "text-amber-600"
                    }`}
            >
                {Number(remainingUnifyedStock)}
            </span>

        </div>
    )
}

export default StockAvailabilityUnified