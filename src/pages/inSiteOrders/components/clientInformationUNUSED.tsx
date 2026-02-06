// import { Client } from '@/types/clients';
// import ClientHistoricalMvts from './clientHistoricalMvts';
// import { Label } from '../../../components/ui/label';
// import { formatCurrency } from '@/utils/prices';
// import { formatDate } from '@/utils';
// import { taxConditionsOpt } from '@/constants';

// const ClientInformation = ({
//     selectedClient,
//     showHistoricalMvtsBtn = true
// }: {
//     selectedClient: Client;
//     showHistoricalMvtsBtn?: boolean;
// }) => {
//     return (selectedClient && (
//         <div className=" w-full ">

//             <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-x-4 gap-y-1 text-xs">
//                 <div className='flex flex-col gap-2 text-center'>
//                     <Label className='flex items-center justify-center'>Credito disponible</Label>
//                     <span>{formatCurrency(selectedClient.available_credit)}</span>
//                 </div>

//                 <div className='flex flex-col gap-2 text-center'>
//                     <Label className='flex items-center justify-center'>Credito disponible</Label>
//                     <span>{formatCurrency(selectedClient.credit_limit || 0)}</span>
//                 </div>

//                 <div className='flex flex-col gap-2 text-center'>
//                     <Label className='flex items-center justify-center'>Saldo actual</Label>
//                     <span>{formatCurrency(selectedClient.current_balance)}</span>
//                 </div>

//                 <div className='flex flex-col gap-2 text-center'>
//                     <Label className='flex items-center justify-center'>Cond. impositiva</Label>
//                     <span>{taxConditionsOpt.find(opt => opt.value === selectedClient.tax_condition)?.label}</span>
//                 </div>

//                 <div className='flex flex-col gap-2 text-center'>
//                     <Label className='flex items-center justify-center'>Últ. transacción</Label>
//                     <span>{formatDate(selectedClient.last_transaction_date)}</span>
//                 </div>

//                 {showHistoricalMvtsBtn && (
//                     <ClientHistoricalMvts selectedClientId={selectedClient.client_id} />
//                 )}

//             </div>

//         </div>

//     )
//     )
// }

// export default ClientInformation