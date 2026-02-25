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

export function StockBreakdownDialog({
    productId,
    totalBaseUnits,
    reservedForSelling,
    reservedForTransferring,
}: {
    productId: number;
    totalBaseUnits: number;
    reservedForSelling: number;
    reservedForTransferring: number;
}) {
    const [open, setOpen] = useState(false);

    const { data: presentations = [] } = useQuery({
        queryKey: ["presentation-summary", productId],
        queryFn: () => getProductPresentationsSummary(productId),
        enabled: open,
        staleTime: 5 * 60 * 1000,
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="cursor-pointer" type="button">
                    <Info width={12} height={12} />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px]">
                <DialogHeader>
                    <DialogTitle>Stock disponible por presentación</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-slate-500">
                    Stock base total:{" "}
                    <span className="font-semibold text-slate-700">{totalBaseUnits}</span>
                </p>
                <Table className="rounded-lg border">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Presentación</TableHead>
                            <TableHead className="text-center">Stock Total</TableHead>
                            <TableHead className="text-center">Reservado venta</TableHead>
                            <TableHead className="text-center">Reservado transferencia</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {presentations.map((p) => {
                            const bqe = bqeOrOne(p.bulk_quantity_equivalence);
                            const available = Math.floor(totalBaseUnits / bqe);
                            const selling = Math.floor(reservedForSelling / bqe);
                            const transferring = Math.floor(reservedForTransferring / bqe);
                            return (
                                <TableRow key={p.product_presentation_id}>
                                    <TableCell className="font-medium">
                                        {p.product_presentation_name}
                                        <span className="ml-1 text-xs text-slate-400">
                                            ({bqe} u.base)
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                        {available}
                                    </TableCell>
                                    <TableCell className="text-center text-amber-600">
                                        {selling}
                                    </TableCell>
                                    <TableCell className="text-center text-blue-600">
                                        {transferring}
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
