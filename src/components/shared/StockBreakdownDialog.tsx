import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getProductPresentationsSummary } from "@/service/productPresentations";
import { bqeOrOne } from "@/utils";
import type { UseProductStockReturn } from "@/hooks/useProductStock";

export function StockBreakdownDialog({
    productId,
    stockData,
}: {
    productId: number;
    stockData: UseProductStockReturn;
}) {
    const [open, setOpen] = useState(false);

    const { data: presentations = [] } = useQuery({
        queryKey: ["presentation-summary", productId],
        queryFn: () => getProductPresentationsSummary(productId),
        enabled: open,
        staleTime: 5 * 60 * 1000,
    });

    const {
        totalBaseUnits,
        reservedForSelling,
        reservedForTransferring,
        availableBaseUnits,
        currentCartByPresentation,
        otherCartsByPresentation,
    } = stockData;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="cursor-pointer" type="button">
                    <Info width={12} height={12} />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[920px]">
                <DialogHeader>
                    <DialogTitle>Stock disponible por presentación</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-500">
                    Stock base total:{" "}
                    <span className="font-semibold text-slate-700">{totalBaseUnits}</span>
                    {" · "}
                    Stock disponible:{" "}
                    <span className="font-semibold text-green-700">{availableBaseUnits}</span>
                </p>
                <Table className="rounded-lg border">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Presentación</TableHead>
                            <TableHead className="text-center">Stock Total</TableHead>
                            <TableHead className="text-center text-amber-600">En otros pedidos</TableHead>
                            <TableHead className="text-center text-blue-600">En transferencia</TableHead>
                            <TableHead className="text-center text-purple-600">En otros carritos</TableHead>
                            <TableHead className="text-center text-orange-600">En este carrito</TableHead>
                            <TableHead className="text-center text-green-700">Stock Disponible</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {presentations.map((p) => {
                            const bqe = bqeOrOne(p.bulk_quantity_equivalence);
                            const presId = p.product_presentation_id;
                            return (
                                <TableRow key={presId}>
                                    <TableCell className="font-medium">
                                        {p.product_presentation_name}
                                        <span className="ml-1 text-xs text-slate-400">
                                            ({bqe} u.base)
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {Math.floor(totalBaseUnits / bqe)}
                                    </TableCell>
                                    <TableCell className="text-center text-amber-600">
                                        {Math.floor(reservedForSelling / bqe)}
                                    </TableCell>
                                    <TableCell className="text-center text-blue-600">
                                        {Math.floor(reservedForTransferring / bqe)}
                                    </TableCell>
                                    <TableCell className="text-center text-purple-600">
                                        {otherCartsByPresentation[presId] ?? 0}
                                    </TableCell>
                                    <TableCell className="text-center text-orange-600">
                                        {currentCartByPresentation[presId] ?? 0}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-green-700">
                                        {Math.floor(availableBaseUnits / bqe)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
}
