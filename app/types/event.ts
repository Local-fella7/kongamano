export interface Event {
  id: number;
  name: string;
  code?: string;
  event_type_id: number;
  event_type_name?: string;
  theme?: string;
  venue?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  date_from?: string;
  date_to?: string;
  registration_deadline?: string;
  fee?: number;
  capacity?: number;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
  created_at?: string;
  updated_at?: string;
}
