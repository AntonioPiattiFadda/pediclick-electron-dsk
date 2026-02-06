import { Stock } from "@/types/stocks"
import { StockData } from "../stockData"

const StockAvailability = ({ selectedStock, remainingStock }: {
    selectedStock: Stock,
    remainingStock: number
}) => {
    return (
        <div className="flex flex-col gap-1 mt-1">

            <div className="flex gap-1 items-center justify-center">
                <span className="text-xs text-slate-500">Stock disponible</span>
                <StockData stock={selectedStock} />
            </div>
            <span
                className={`text-base font-semibold ${remainingStock > 0 ? "text-green-600" : "text-amber-600"
                    }`}
            >
                {Number(remainingStock)}
            </span>

        </div>
    )
}

export default StockAvailability