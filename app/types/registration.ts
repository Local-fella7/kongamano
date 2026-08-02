export interface Registration {
  id: number;
  event_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  email: string;
  payment_mode_id?: number;
  amount?: number | string;
  status: string; // "Pending" | "Confirmed" | "Cancelled"
  created_at?: string;
  updated_at?: string;
  event?: {
    id: number;
    name: string;
  };
  payment_mode?: {
    id: number;
    name: string;
  };
}
