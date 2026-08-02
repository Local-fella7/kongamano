export interface EventService {
  id: number;
  event_id: number;
  service_id: number;
  event?: {
    id: number;
    name: string;
  };
  service?: {
    id: number;
    name: string;
    start_time?: string;
    end_time?: string;
    requires_scan?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface EventAccommodation {
  id: number;
  event_id: number;
  accommodation_id: number;
  event?: {
    id: number;
    name: string;
  };
  accommodation?: {
    id: number;
    name: string;
    type?: string;
    capacity?: number;
    cost_per_night?: number;
  };
  created_at?: string;
  updated_at?: string;
}
