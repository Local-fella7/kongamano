export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  mobile: string;
  role_id: number;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
