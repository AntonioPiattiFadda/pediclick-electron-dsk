export type MovementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'IN_TRANSIT';


export type PaginationType = {
    page: number;
    pageSize: number;
};

export type SellType = 'MINOR' | 'MAYOR';

export type SellUnit = 'BY_UNIT' | 'BY_WEIGHT';

export type StockTypeToShow = 'STOCK' | 'SOLD' | 'NO-STOCK' | 'ALL';
