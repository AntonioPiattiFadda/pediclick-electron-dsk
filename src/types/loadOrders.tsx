export type LoadOrder = {
  load_order_id?: string;
  business_owner_id?: number; // Viene por defecto del usuario logueado
  load_order_number: string; //Input tipo numero
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

  assigned_to: number | null; // El lugar deposito o receptor o limbo
  // Esto todavia no lo hagas

  invoice_number: number | null;
};
