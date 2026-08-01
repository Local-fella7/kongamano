export interface Service {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  requires_scan: boolean | number;
  created_at?: string;
  updated_at?: string;
}
