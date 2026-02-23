export type MovementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'IN_TRANSIT';

export type CheckOutOptions = {
    printTicket: boolean;
    registerPositiveCredit: boolean;
};


export type SellType = 'MINOR' | 'MAYOR';

export type SellUnit = 'BY_UNIT' | 'BY_WEIGHT';
