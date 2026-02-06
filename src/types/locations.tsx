type LocationType = 'STOCK_ROOM' | 'STORE';

export type Location = {
    location_id?: number;
    type: LocationType;
    name: string;
    address: string;
    created_at: string;
    deleted_at: string | null;
}