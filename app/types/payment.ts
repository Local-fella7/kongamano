export interface Payment {
  id: number;
  registration_id: number;
  registration?: {
    id: number;
    reg_code?: string;
    first_name?: string;
    last_name?: string;
  };
  payment_mode_id: number;
  payment_mode?: {
    id: number;
    name: string;
  };
  amount: number;
  reference_no?: string | null;
  created_at?: string;
  updated_at?: string;
}
