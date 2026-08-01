export interface Event {
  id: number;
  event_type_id: number;
  name: string;
  date_from: string;
  date_to: string;
  location: string;
  description: string;
}

export interface EventType {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  requires_scan: boolean;
}

export interface Accommodation {
  id: number;
  name: string;
  capacity: number;
  country: string;
  district: string;
  city: string;
}
