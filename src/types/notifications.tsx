export type NotificationsType = {
    notification_id?: number;
    organization_id?: string;
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