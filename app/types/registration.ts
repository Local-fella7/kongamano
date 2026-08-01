export interface Registration {
  id: number;
  event_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  email: string;
  payment_mode_id: number;
  amount: number;
  status: 'Pending' | 'Confirmed';
  created_at?: string;
}

export interface Payment {
  id: number;
  registration_id: number;
  payment_mode_id: number;
  amount: number;
  reference_no: string;
  created_at?: string;
}

export interface PaymentMode {
  id: number;
  name: string;
}
