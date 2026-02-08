// !SECTION HELPER FUNCIONES DE PRINT

import { DeliveryOrderPayload, PrintTicketPayload } from "@/types/printer";

const ESC = 0x1b;
const GS = 0x1d;

export const escpos = {
    init: () => Buffer.from([ESC, 0x40]),

    align: {
        left: () => Buffer.from([ESC, 0x61, 0x00]),
        center: () => Buffer.from([ESC, 0x61, 0x01]),
        right: () => Buffer.from([ESC, 0x61, 0x02]),
    },

    bold: {
        on: () => Buffer.from([ESC, 0x45, 0x01]),
        off: () => Buffer.from([ESC, 0x45, 0x00]),
    },

    size: {
        normal: () => Buffer.from([GS, 0x21, 0x00]),
        double: () => Buffer.from([GS, 0x21, 0x11]), // alto + ancho
    },

    text: (txt: string) => Buffer.from(txt, "ascii"),

    feed: (n = 1) => Buffer.from([ESC, 0x64, n]),

    cut: () => Buffer.from([GS, 0x56, 0x00]),
};


export function buildPrinterSelectedBuffer(printContent: PrintTicketPayload): Buffer {
    console.log("buildPrinterSelectedBuffer", printContent);
    return Buffer.concat([
        escpos.init(),
        escpos.align.center(),
        escpos.bold.on(),
        escpos.size.double(),

        escpos.text("IMPRESORA SELECCIONADA\n"),

        escpos.size.normal(),
        escpos.bold.off(),
        escpos.feed(3),
        escpos.cut(),
    ]);
}

export function printTicket(payload: PrintTicketPayload): Buffer {
    const buffers: Buffer[] = [];

    const { user, location, order, orderItems } = payload;
    console.log("payload", payload);

    buffers.push(escpos.init());

    // =========================
    // USER (OPTIONAL)
    // =========================
    if (user?.full_name) {
        buffers.push(escpos.align.center());
        buffers.push(escpos.bold.on());
        buffers.push(escpos.text(user.full_name + "\n"));
        buffers.push(escpos.bold.off());
        buffers.push(escpos.feed(1));
    }

    // =========================
    // LOCATION (OPTIONAL)
    // =========================
    if (location) {
        buffers.push(escpos.align.center());
        buffers.push(escpos.bold.on());
        buffers.push(escpos.text(location.name + "\n"));
        buffers.push(escpos.bold.off());

        if (location.address) {
            buffers.push(escpos.text(location.address + "\n"));
        }

        buffers.push(escpos.feed(1));
    }

    // =========================
    // ORDER HEADER (ALWAYS)
    // =========================
    buffers.push(escpos.align.center());
    buffers.push(escpos.bold.on());
    buffers.push(escpos.size.double());
    buffers.push(escpos.text("COMPROBANTE\n"));
    buffers.push(escpos.size.normal());
    buffers.push(escpos.bold.off());

    buffers.push(escpos.text(`Orden: ${order.order_number}\n`));
    buffers.push(escpos.text(`Fecha: ${new Date(order.created_at).toLocaleString()}\n`));
    buffers.push(escpos.text(`Estado pago: ${order.payment_status}\n`));
    buffers.push(escpos.feed(1));

    // =========================
    // ITEMS (ALWAYS)
    // =========================
    buffers.push(escpos.align.left());

    orderItems.forEach((item) => {
        buffers.push(
            escpos.text(
                `${item.quantity} x ${item.product_name} (${item.product_presentation_name})\n`
            )
        );

        buffers.push(
            escpos.text(
                `$ ${item.price.toFixed(2)}  Subtotal: $ ${item.subtotal.toFixed(2)}\n`
            )
        );
    });

    buffers.push(escpos.feed(1));

    // =========================
    // TOTALS (ALWAYS)
    // =========================
    buffers.push(escpos.align.right());

    buffers.push(escpos.text(`Subtotal: $ ${order.subtotal.toFixed(2)}\n`));

    if (order.discount !== undefined) {
        buffers.push(escpos.text(`Descuento: $ ${order.discount.toFixed(2)}\n`));
    }

    if (order.tax !== undefined) {
        buffers.push(escpos.text(`Impuestos: $ ${order.tax.toFixed(2)}\n`));
    }

    buffers.push(escpos.bold.on());
    buffers.push(escpos.text(`TOTAL: $ ${order.total_amount.toFixed(2)}\n`));
    buffers.push(escpos.bold.off());

    // =========================
    // FOOTER
    // =========================
    buffers.push(escpos.feed(5));
    buffers.push(escpos.cut());

    return Buffer.concat(buffers);
}


export function printDeliveryOrder(payload: DeliveryOrderPayload): Buffer {
    console.log("printDeliveryOrder", payload);
    const buffers: Buffer[] = [];

    const { user, location, order, orderItems, client } = payload;
    console.log("payload", payload);

    buffers.push(escpos.init());

    // =========================
    // USER (OPTIONAL)
    // =========================

    if (user?.full_name) {
        buffers.push(escpos.align.center());
        buffers.push(escpos.bold.on());
        buffers.push(escpos.text('Creado por' + "\n"));
        buffers.push(escpos.bold.off());
        if (location.address) {
            buffers.push(escpos.text(user.full_name + "\n"));
        }
        buffers.push(escpos.feed(1));
    }

    // =========================
    // LOCATION (OPTIONAL)
    // =========================
    if (location) {
        buffers.push(escpos.align.center());
        buffers.push(escpos.bold.on());
        buffers.push(escpos.text(location.name + "\n"));
        buffers.push(escpos.bold.off());

        if (location.address) {
            buffers.push(escpos.text(location.address + "\n"));
        }

        buffers.push(escpos.feed(1));
    }

    // =========================
    // ORDER HEADER (ALWAYS)
    // =========================
    buffers.push(escpos.align.center());
    buffers.push(escpos.bold.on());
    buffers.push(escpos.size.double());
    buffers.push(escpos.text(`PEDIDO: ${client?.full_name}\n`));
    buffers.push(escpos.size.normal());
    buffers.push(escpos.bold.off());

    // buffers.push(escpos.text(`Orden: ${order.order_number}\n`));
    buffers.push(escpos.text(`Fecha: ${new Date(order.created_at).toLocaleString()}\n`));
    // buffers.push(escpos.text(`Estado pago: ${order.payment_status}\n`));
    buffers.push(escpos.feed(1));

    // =========================
    // ITEMS (ALWAYS)
    // =========================
    buffers.push(escpos.align.left());

    orderItems.forEach((item) => {
        buffers.push(
            escpos.text(
                `${item.quantity} x ${item.product_name} (${item.product_presentation_name})\n`
            )
        );

        // buffers.push(
        //     escpos.text(
        //         `$ ${item.price.toFixed(2)}  Subtotal: $ ${item.subtotal.toFixed(2)}\n`
        //     )
        // );
    });

    buffers.push(escpos.feed(1));

    // =========================
    // TOTALS (ALWAYS)
    // =========================
    buffers.push(escpos.align.right());

    // buffers.push(escpos.text(`Subtotal: $ ${order.subtotal.toFixed(2)}\n`));

    // if (order.discount !== undefined) {
    //     buffers.push(escpos.text(`Descuento: $ ${order.discount.toFixed(2)}\n`));
    // }

    // if (order.tax !== undefined) {
    //     buffers.push(escpos.text(`Impuestos: $ ${order.tax.toFixed(2)}\n`));
    // }

    // buffers.push(escpos.bold.on());
    // buffers.push(escpos.text(`TOTAL: $ ${order.total_amount.toFixed(2)}\n`));
    // buffers.push(escpos.bold.off());

    // =========================
    // FOOTER
    // =========================
    buffers.push(escpos.feed(5));
    buffers.push(escpos.cut());

    return Buffer.concat(buffers);
}