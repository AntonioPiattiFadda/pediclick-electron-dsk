import { useDeliveryOrderContext } from "@/context/DeliveryOrderContext";
import {
  ProductPresentationSelectorRoot,
  SelectProductPresentation,
} from "../../../components/shared/selectors/productPresentationSelector";
import ProductSelector from "../../../components/shared/selectors/productSelector";
import { Fraction } from "../../../components/shared/transformation/Fraction";
import { Label } from "../../../components/ui/label";
import { useGetLocationData } from "@/hooks/useGetLocationData";
import { useFocusableInput } from "@/hooks/useFocus";

export const ProductSelectorDeliveryOrder = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    productPresentation,
    setProductPresentation,
  } = useDeliveryOrderContext();

  const { handleGetLocationId } = useGetLocationData();

  const noProductNorProductPresentationSelected =
    !selectedProduct.product_id || !productPresentation?.product_presentation_id;

  const productShortCodeRef = useFocusableInput("product-shortcode", 1);
  const productPresentationShortCodeRef = useFocusableInput(
    "product-presentation-shortcode",
    2
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-16 gap-2">
          <div className="flex flex-col col-span-7 gap-1">
            <Label>Producto:</Label>
            <ProductSelector
              focusRef={productShortCodeRef}
              value={selectedProduct}
              onChange={(value) =>
                setSelectedProduct({ ...selectedProduct, ...value })
              }
            />
          </div>
          <div className="flex flex-col gap-1 col-span-8">
            <Label>Presentación:</Label>
            <ProductPresentationSelectorRoot
              locationId={handleGetLocationId()}
              productId={selectedProduct.product_id!}
              value={productPresentation}
              onChange={(value) => {
                if (value) setProductPresentation(value);
              }}
              isFetchWithLots={true}
              isFetchWithLotContainersLocation={false}
            >
              <SelectProductPresentation
                focusRef={productPresentationShortCodeRef}
              />
            </ProductPresentationSelectorRoot>
          </div>
          <div className="mt-auto mb-[2px]">
            <Fraction disabled={noProductNorProductPresentationSelected} />
          </div>
        </div>
      </div>
    </>
  );
};
