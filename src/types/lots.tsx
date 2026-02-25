// import { Database } from "./database.types";

import { Stock } from "./stocks";

// export type Lot = Database['public']['Tables']['lots']['Row'];
// export type LotInsert = Database['public']['Tables']['lots']['Insert'];
// export type LotUpdate = Database['public']['Tables']['lots']['Update'];

export type CommissionType = 'NONE' | 'PERCENTAGE' | 'UNIT_VALUE';

export type Lot = {
    lot_id: number;
    provider_id: number | null;
    expiration_date: string | null;
    expiration_date_notification: boolean;
    created_at: string;
    updated_at: string;
    initial_stock_quantity: number | null;
    is_sold_out: boolean | null;
    is_expired: boolean | null;
    load_order_id: number | null;
    product_id: number | null;
    purchase_cost_total: number | null;
    purchase_cost_per_unit: number | null;
    download_total_cost: number | null;
    download_cost_per_unit: number | null;
    final_cost_total: number | null;
    final_cost_per_unit: number | null;
    purchase_cost_per_bulk: number | null;
    download_cost_per_bulk: number | null;
    final_cost_per_bulk: number | null;
    bulk_quantity_equivalence: number | null;
    delivery_cost_total: number | null;
    delivery_cost_per_unit: number | null;
    delivery_cost_per_bulk: number | null;
    productor_commission_type: CommissionType;
    productor_commission_percentage: number | null;
    productor_commission_unit_value: number | null;
    purchasing_agent_id: number | null;
    purchasing_agent_commision_type: CommissionType;
    purchasing_agent_commision_percentage: number | null;
    purchasing_agent_commision_unit_value: number | null;
    extra_cost_total: number | null;
    is_finished: boolean | null;

    stock?: Stock[];
};