import { MovementStatus } from ".";
import { LotContainerMovement } from "./lotContainerMovements";
import type { LotContainersStock } from "./lotContainersStock";
import type { Lot } from "./lots";
import type { ProductPresentation } from "./productPresentation";
import type { Product } from "./products";

export interface TransferOrderItem {
    //FIXME NO VA A COINCIDIR CON LA DB
    transfer_order_item_id?: number;
    transfer_order_id: number;

    product_id: number | null;
    product_presentation_id: number | null;

    //SECTION ELEMENTOS QUE QUEDAN EN PENDING
    quantity: number;
    lot_containers_location_id: number | null;

    lot_containers_movement_id: number | null;
    lot_id: number | null;

    stock_id: number | null;

    is_new?: boolean;
    is_transferred: boolean;
    created_at?: string;
    status: MovementStatus


    product?: Pick<Product, "product_id" | "product_name"> | null;
    product_presentation?: Pick<ProductPresentation, "product_presentation_id" | "product_presentation_name"> | null;
    lot?: Lot | null;
    lot_containers_location?: LotContainersStock | null;
    lot_containers_movement?: LotContainerMovement | null;


}
