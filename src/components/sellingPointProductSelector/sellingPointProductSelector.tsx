import { useState } from 'react'
import ProductSelector from '../shared/productSelector'
import { Product } from '@/types/products'


const SellingPointProductSelector = () => {
    const [selectedProduct, setSelectedProduct] = useState<Product>({} as Product)
    return (
        <div>
            Selecciona producto:
            <ProductSelector value={selectedProduct} onChange={setSelectedProduct} />
        </div>
    )
}

export default SellingPointProductSelector