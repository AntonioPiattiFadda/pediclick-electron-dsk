import type { TaxConditionType } from "@/types/clients";
import { Payment } from "@/types/payments";

export const taxConditionsOpt: { value: TaxConditionType; label: string }[] = [
    { value: "VAT_REGISTERED_RESPONSIBLE", label: "IVA Responsable Inscripto" },
    { value: "VAT_EXEMPT_SUBJECT", label: "IVA Sujeto Exento" },
    { value: "FINAL_CONSUMER", label: "Consumidor Final" },
    { value: "MONOTAX_RESPONSIBLE", label: "Responsable Monotributo" },
    { value: "UNCATEGORIZED_SUBJECT", label: "Sujeto No Categorizado" },
    { value: "FOREIGN_SUPPLIER", label: "Proveedor del Exterior" },
    { value: "FOREIGN_CLIENT", label: "Cliente del Exterior" },
    { value: "VAT_LIBERATED_LAW_19640", label: "IVA Liberado - Ley Nº 19.640" },
    { value: "SOCIAL_MONOTAX", label: "Monotributista Social" },
    { value: "VAT_NOT_REACHED", label: "IVA No Alcanzado" },
    {
        value: "PROMOTED_INDEPENDENT_MONOTAX_WORKER",
        label: "Monotributista Trabajador Independiente Promovido",
    },
];

export const transferOrderStatuses = {
    PENDING: "Pendiente",
    IN_TRANSIT: "En Tránsito",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
} as const;

export const emptyPayments: Pick<Payment, "payment_method" | "amount" | 'payment_direction' | 'payment_type'>[] = [
    { payment_method: 'CASH', amount: 0, payment_direction: "IN", payment_type: "ORDER" },
    { payment_method: 'DEBIT_CARD', amount: 0, payment_direction: "IN", payment_type: "ORDER" },
    { payment_method: 'BANK_TRANSFER', amount: 0, payment_direction: "IN", payment_type: "ORDER" },
    { payment_method: 'CREDIT_CARD', amount: 0, payment_direction: "IN", payment_type: "ORDER" },
    { payment_method: 'CHECK', amount: 0, payment_direction: "IN", payment_type: "ORDER" },
    // { payment_method: 'MOBILE_PAYMENT', amount: 0 },
    { payment_method: 'ON_CREDIT', amount: 0, payment_direction: "IN", payment_type: "ORDER" },
]

export const paymentMethodOpt = [
    { value: 'CASH', label: 'Efectivo', keyCode: 'F1' },
    { value: 'DEBIT_CARD', label: 'Tarjeta Débito', keyCode: 'F2' },
    { value: 'BANK_TRANSFER', label: 'Transferencia Bancaria', keyCode: 'F3' },
    { value: 'CREDIT_CARD', label: 'Tarjeta Crédito', keyCode: 'F4' },
    // { value: 'MOBILE_PAYMENT', label: 'Pago Móvil', keyCode: 'F5' },
    { value: 'CHECK', label: 'Cheque', keyCode: 'F5' },
    // { value: 'CRYPTO', label: 'Cripto', keyCode: 'F8' }
    { value: 'ON_CREDIT', label: 'Cuenta Corriente', keyCode: 'F6' },
    { value: 'OVERPAYMENT', label: 'Saldo a favor' },
];

export const priceTypeOpt = [
    { value: 'MINOR', label: 'Minorista' },
    { value: 'MAJOR', label: 'Mayorista' },
];

export const priceLogicTypeOpt = [
    { value: 'QUANTITY_DISCOUNT', label: 'Descuento por Cantidad' },
    { value: 'SPECIAL', label: 'Precio Especial' },
    { value: 'LIMITED_OFFER', label: 'Oferta Limitada' },
];


export const ROLES = [
    {
        label: "Encargado",
        value: "MANAGER",
        descripcion:
            "Tendra acceso a la creacion de empleados dentro del sistema y a la gestion de inventario",
    },
    {
        label: "Empleado",
        value: "EMPLOYEE",
        descripcion:
            "Solo podra acceder a la pantalla de vendedor. Sin permisos para ingresar a los datos del sistema",
    },
    {
        label: "Propietario",
        value: "OWNER",
        descripcion:
            "Tendra acceso total a todas las funcionalidades del sistema, incluyendo la gestion de usuarios y configuraciones.",
    }
];