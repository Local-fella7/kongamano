export interface Agent {
  id: number;
  name: string;
  user_id?: number | null;
  user?: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
  };
  registration_no?: string | null;
  country?: string | null;
  region?: string | null;
  district?: string | null;
  ward?: string | null;
  created_at?: string;
  updated_at?: string;
}
