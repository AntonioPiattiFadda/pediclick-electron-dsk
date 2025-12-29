export type NotificationsType = {
    notification_id?: number;
    business_owner_id?: string;
    title: string;
    message: string;
    status: "PENDING" | "READ" | "ARCHIVED";
    order_id?: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    canceled_by: string;
    location_id: number;
}