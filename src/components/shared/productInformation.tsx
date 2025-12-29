import { Product } from "@/types/products"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"



const ProductInformation = ({ product }: {
    product: Product
}) => {
    return (
        <div className="flex gap-2">
            <Avatar className="rounded-lg">
                <AvatarImage
                    src={product.public_images?.public_image_src || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
                    alt={product.product_name}
                />
                <AvatarFallback>ER</AvatarFallback>
            </Avatar>
            {product.product_name} - {product.brands?.brand_name}
        </div>
    )
}

export default ProductInformation

