export type MovementStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'IN_TRANSIT';

export type CheckOutOptions = {
    printTicket: boolean;
    registerPositiveCredit: boolean;
};