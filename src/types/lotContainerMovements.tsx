import type { MovementStatus } from ".";

export interface LotContainerMovement {
    lot_container_movement_id: number;
    created_at: string;
    quantity: number;

    from_store_id: number | null;
    to_store_id: number | null;

    from_stock_room_id: number | null;
    to_stock_room_id: number | null;

    from_provider_id: number | null;
    to_provider_id: number | null;

    from_client_id: number | null;
    to_client_id: number | null;

    lot_container_id: number;

    from_store_name: string | null;
    to_store_name: string | null;
    from_stock_room_name: string | null;
    to_stock_room_name: string | null;
    from_provider_name: string | null;
    to_provider_name: string | null;
    from_client_name: string | null;
    to_client_name: string | null;


    transfer_order_item_id?: number | null;
    status: MovementStatus;


    lot_containers_location_id: number | null;
}
