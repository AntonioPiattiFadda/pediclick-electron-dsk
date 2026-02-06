import { MovementStatus } from ".";
import type { TransferOrderItem } from "./transferOrderItems";
import type { UserProfile } from "./users";

export interface TransferOrderType {
    transfer_order_id: number;
    created_at: string;
    assigned_user_id: string | null;


    from_location_id: number | null;
    to_location_id: number | null;
    notes: string | null;

    from_location: Partial<Location> | null;
    to_location: Partial<Location> | null;

    status: MovementStatus;

    transfer_order_items?: TransferOrderItem[];


    assigned_user?: UserProfile | null;



}
