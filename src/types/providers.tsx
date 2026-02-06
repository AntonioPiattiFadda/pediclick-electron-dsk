export interface Provider {
  provider_id: string;
  provider_name: string;

  //TODO Agregar mas datos porque pueden tener cuenta corriente tmb
  organization_id: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
