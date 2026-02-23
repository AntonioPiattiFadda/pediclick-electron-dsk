import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/stores/store"
import {
    setSelectedProduct,
    setProductPresentation,
    setSelectedStockId,
    setSelectedPriceId,
    setEffectivePrice,
    setSelectedLotId,
} from "@/stores/orderSlice"
import { useMemo } from 'react'
import { ProductPresentationSelectorRoot, SelectProductPresentation } from '../../../components/shared/selectors/productPresentationSelector'
import ProductSelector from '../../../components/shared/selectors/productSelector'
import { Fraction } from '../../../components/shared/transformation/Fraction'
import { Label } from '../../../components/ui/label'
import { useGetLocationData } from "@/hooks/useGetLocationData"
import { useFocusableInput } from "@/hooks/useFocus"
import { FOCUS_ORDER } from "@/constants/focusOrder"

const ProductSelectorDeliveryOrderAi = () => {
    const dispatch = useDispatch<AppDispatch>();
    const selectedProduct = useSelector((state: RootState) => state.order.selectedProduct);
    const productPresentations = useSelector((state: RootState) => state.order.productPresentations);
    const productPresentation = useSelector((state: RootState) => state.order.productPresentation);
    const selectedStockId = useSelector((state: RootState) => state.order.selectedStockId);
    const selectedLotId = useSelector((state: RootState) => state.order.selectedLotId);

    const { handleGetLocationId } = useGetLocationData();

    const productPresentationId = productPresentation?.product_presentation_id;

    const selectedProductPresentation = useMemo(() => {
        return productPresentations.find(pp => pp.product_presentation_id === productPresentationId) || null;
    }, [productPresentations, productPresentationId]);

    const selectedLot = useMemo(() => {
        if (!selectedProductPresentation?.lots) return null;
        return selectedProductPresentation?.lots.find(lot => lot.lot_id === selectedLotId) ?? null;
    }, [selectedProductPresentation?.lots, selectedLotId]);

    const selectedStock = useMemo(() => {
        if (!selectedLot?.stock) return null;
        return selectedLot.stock.find(stock => stock.stock_id === selectedStockId) ?? null;
    }, [selectedLot, selectedStockId]);

    const noProductNorProductPresentationSelected = !selectedProduct.product_id || !productPresentation?.product_presentation_id || selectedStock?.quantity === 0;

    const productShortCodeRef = useFocusableInput("product-shortcode", FOCUS_ORDER.PRODUCT);
    const productPresentationShortCodeRef = useFocusableInput("product-presentation-shortcode", FOCUS_ORDER.PRODUCT_PRESENTATION);

    return (<>
        <div className='flex flex-col gap-2'>
            <div className='grid grid-cols-16 gap-2'>
                <div className='flex flex-col col-span-7 gap-1'>
                    <Label>
                        Producto:
                    </Label>
                    <ProductSelector
                        focusRef={productShortCodeRef}
                        value={selectedProduct}
                        onChange={(value) =>
                            dispatch(setSelectedProduct({ ...selectedProduct, ...value }))
                        }
                    />
                </div>
                <div className='flex flex-col gap-1 col-span-8 '>
                    <Label>
                        Presentación:
                    </Label>
                    <ProductPresentationSelectorRoot
                        locationId={handleGetLocationId()}
                        productId={selectedProduct.product_id!}
                        value={productPresentation}
                        onChange={(value) => {
                            const firstLotId = value?.lots?.[0]?.lot_id || null;
                            const firstStockOfFirstLotId = value?.lots?.[0]?.stock?.[0]?.stock_id || null;
                            const firstPrice = value?.prices?.[0] || null;

                            if (value) {
                                dispatch(setProductPresentation(value));
                                dispatch(setSelectedLotId(firstLotId));
                                dispatch(setSelectedStockId(firstStockOfFirstLotId));
                                dispatch(setSelectedPriceId(firstPrice?.price_id || null));
                                dispatch(setEffectivePrice(firstPrice?.price || 0));
                            }
                        }}
                        isFetchWithLots={true}
                        isFetchWithLotContainersLocation={false}
                    >
                        <SelectProductPresentation
                            focusRef={productPresentationShortCodeRef}
                        />
                        {/* <CreateProductPresentation /> */}
                    </ProductPresentationSelectorRoot>
                </div>
                <div className='mt-auto mb-[2px]'>
                    <Fraction
                        disabled={noProductNorProductPresentationSelected}
                    />
                </div>
            </div>
        </div>
    </>
    )
}

export default ProductSelectorDeliveryOrderAi
