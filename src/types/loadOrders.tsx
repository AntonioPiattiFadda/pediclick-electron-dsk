import type { Lot } from "./lots";

export type LoadOrder = {
  load_order_id?: number;
  business_owner_id?: number; // Viene por defecto del usuario logueado
  load_order_number: number | null; //Input tipo numero
  //Lo tiene el remito del proveedor
  provider_id: number | null; //Al seleccionar se despliegan adderess y ciuit abjo que vienen por base dde datos
  //   address: string | null;
  //   cuit: string | null;
  //Te va a dar error en base de datos porque no esta creado el campo address ni cuit
  // puede tener un codigo porque pueden ser muchos proveedores.
  // Al lado tiene el boton de + nuevo de proveedor

  delivery_date: string; // Auytomaticamente seleccionar la fecha de hoy sino que el cliente la pueda cambiar
  //Fijate como ejemplo el cenvimiento del prodcutso en lote
  receptor_id: number | null;
  receptor_other: string | null; // Si no esta en la lista que pueda poner otro
  // Tiene que elegir entre los empleados o poner otro y agregar un string.
  // No esta hecho.
  // Tiene que haber la opcion de otro y esee campo es un string Como primera opcion pones otro.

  transporter_data: {
    delivery_company: string | null;
    name: string | null;
    licence_plate: string | null;
    // otros campos que pueda tener el transportista
    // Todo en la misma linea
  };

  delivery_price: number | null;

  invoice_number: number | null;

  created_at?: string; // Fecha de creacion automatico
  updated_at?: string; // Fecha de actualizacion automatico
  deleted_at?: string | null; // Fecha de eliminacion automatico

  lots?: Lot[]; // Esto no va a ir en el formulario. Se crea automaticamente al crear el remito

  //NOTE LO AGREGO? SI porque le tengo que dar un cierre al remito?
  status?: "PENDING" | "COMPLETED" | "CANCELED"; // Por defecto pending

  providers?: {
    provider_name: string;
  };
};
