import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useGetLocationData } from '@/hooks/useGetLocationData';
import { getUserId } from '@/service';
import { createWasteStockMovement, getLotsForProduct } from '@/service/stockMovement';
import type { ProductPresentation } from '@/types/productPresentation';
import type { Product } from '@/types/products';
import { bqeOrOne, toBase } from '@/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    ProductPresentationSelectorRoot,
    SelectProductPresentation,
} from '../shared/selectors/productPresentationSelector';
import ProductSelector from '../shared/selectors/productSelector';

type LotOption = {
    lot_id: number;
    stock_id: number;
    available_quantity: number;
};

const RegisterWasteModal = ({ open, onOpenChange }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) => {
    const { handleGetLocationId } = useGetLocationData();
    const locationId = handleGetLocationId() as number;
    const queryClient = useQueryClient();

    const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);
    const [selectedPresentation, setSelectedPresentation] = useState<Partial<ProductPresentation> | null>(null);
    const [selectedLot, setSelectedLot] = useState<LotOption | null>(null);
    const [quantity, setQuantity] = useState<number | null>(null);

    const productId = selectedProduct?.product_id ?? null;

    const { data: lotsRaw = [], isLoading: isLoadingLots } = useQuery({
        queryKey: ['waste-lots', productId, locationId],
        queryFn: () => getLotsForProduct(productId!, locationId),
        enabled: !!productId && !!locationId,
    });

    const { data: userId } = useQuery({
        queryKey: ['user-id'],
        queryFn: getUserId,
    });

    const lots: LotOption[] = lotsRaw
        .map(l => ({
            lot_id: l.lot_id,
            stock_id: l.stock[0]?.stock_id,
            available_quantity: l.stock[0]?.quantity ?? 0,
        }))
        .filter((l): l is LotOption => l.stock_id !== undefined);

    const bqe = bqeOrOne(selectedPresentation?.bulk_quantity_equivalence ?? null);
    const qtyInBaseUnits = quantity !== null ? toBase(quantity, bqe) : null;

    const canSubmit =
        selectedProduct &&
        selectedPresentation?.product_presentation_id &&
        selectedLot &&
        quantity !== null &&
        quantity > 0;

    const wasteMutation = useMutation({
        mutationFn: async () => {
            return await createWasteStockMovement({
                lot_id: selectedLot!.lot_id,
                stock_id: selectedLot!.stock_id,
                movement_type: 'WASTE',
                quantity,
                qty_in_base_units: qtyInBaseUnits,
                product_presentation_id: selectedPresentation!.product_presentation_id!,
                from_location_id: locationId,
                to_location_id: null,
                should_notify_owner: false,
                created_by: userId ?? null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Merma registrada con éxito');
            handleClose();
        },
        onError: (error) => {
            const msg = error instanceof Error ? error.message : 'Error desconocido';
            toast.error('Error al registrar merma: ' + msg);
        },
    });

    const handleClose = () => {
        setSelectedProduct(null);
        setSelectedPresentation(null);
        setSelectedLot(null);
        setQuantity(null);
        onOpenChange(false);
    };

    const handleProductChange = (product: Partial<Product>) => {
        setSelectedProduct(product);
        setSelectedPresentation(null);
        setSelectedLot(null);
        setQuantity(null);
    };

    const handlePresentationChange = (pres: Partial<ProductPresentation> | null) => {
        setSelectedPresentation(pres);
        setSelectedLot(null);
        setQuantity(null);
    };

    const handleLotChange = (lotId: string) => {
        const lot = lots.find(l => l.lot_id === Number(lotId)) ?? null;
        setSelectedLot(lot);
        setQuantity(null);
    };

    const wasteLabel = quantity !== null && selectedPresentation?.product_presentation_name && selectedProduct?.product_name
        ? `${quantity} ${selectedPresentation.product_presentation_name} de ${selectedProduct.product_name}`
        : null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Registrar merma</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <Label>Producto</Label>
                        <ProductSelector
                            value={selectedProduct ?? {}}
                            onChange={handleProductChange}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Presentación</Label>
                        <ProductPresentationSelectorRoot
                            productId={productId}
                            value={selectedPresentation}
                            onChange={handlePresentationChange}
                            locationId={locationId}
                            isFetchWithLots={false}
                            isFetchWithLotContainersLocation={false}
                            disabled={!productId}
                        >
                            <SelectProductPresentation />
                        </ProductPresentationSelectorRoot>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Lote</Label>
                        <Select
                            disabled={!selectedPresentation || isLoadingLots}
                            value={selectedLot ? String(selectedLot.lot_id) : ''}
                            onValueChange={handleLotChange}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingLots ? 'Cargando...' : 'Seleccionar lote'} />
                            </SelectTrigger>
                            <SelectContent>
                                {lots.length === 0 && !isLoadingLots ? (
                                    <SelectItem value="__empty__" disabled>
                                        Sin stock en esta ubicación
                                    </SelectItem>
                                ) : (
                                    lots.map(l => (
                                        <SelectItem key={l.lot_id} value={String(l.lot_id)}>
                                            Lote #{l.lot_id} — {l.available_quantity} disp.
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label>Cantidad a mermar</Label>
                        <Input
                            type="number"
                            disabled={!selectedLot}
                            value={quantity ?? ''}
                            onChange={e => setQuantity(e.target.value === '' ? null : Number(e.target.value))}
                            placeholder="Cantidad"
                            min={0}
                        />
                        {wasteLabel && (
                            <span className="text-sm font-medium text-foreground">{wasteLabel}</span>
                        )}
                        {qtyInBaseUnits !== null && bqe !== 1 && (
                            <span className="text-xs text-muted-foreground">= {qtyInBaseUnits} unidades base</span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={!canSubmit || wasteMutation.isPending}
                        onClick={() => wasteMutation.mutate()}
                    >
                        {wasteMutation.isPending ? 'Registrando...' : 'Registrar merma'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RegisterWasteModal;
