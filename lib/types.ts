export type ReservationStatus = 'pending' | 'checked_in' | 'cancelled' | 'no_show';
export type TableVisualState = 'available' | 'occupied' | 'selected' | 'blocked';

export interface Zone {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
}

export interface MapTable {
  id: string;
  code: string;
  zone_id: string;
  zone_name: string;
  zone_color: string;
  capacity: number;
  min_consumption: number;
  min_consumption_label: string | null;
  pos_x: number;
  pos_y: number;
  shape: 'rect' | 'circle';
  width: number;
  height: number;
  rotation: number;
  is_available: boolean;
}

export interface CreatedReservation {
  id: string;
  code: string;
  qr_token: string;
  cancellation_token: string;
  status: ReservationStatus;
  reservation_date: string;
  reservation_time: string;
  table_code: string;
}

export interface ReservationTicket {
  id: string;
  code: string;
  customer_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  qr_token: string;
  checked_in_at: string | null;
  notes: string | null;
  table_code: string;
  table_capacity: number;
  min_consumption: number;
  min_consumption_label: string | null;
  zone_name: string;
  cancellation_token: string | null;
}

export interface AdminReservation {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  qr_token: string;
  notes: string | null;
  checked_in_at: string | null;
  tables: { code: string; zones: { name: string } | null } | null;
}

export interface OpenDate {
  date: string;
  label: string | null;
}

export interface AdminOpenDate {
  date: string;
  is_open: boolean;
  label: string | null;
  is_default: boolean;
}


export interface EditableTableFull {
  id: string;
  code: string;
  zone_id: string;
  zone_name: string;
  capacity: number;
  min_consumption: number;
  min_consumption_label: string | null;
  is_active: boolean;
}

export interface TableOption {
  id: string;
  code: string;
  zone_name: string;
  capacity: number;
  is_available: boolean;
}

export interface AdminStats {
  total_reservations: number;
  total_guests: number;
  checked_in: number;
  no_show: number;
  cancelled: number;
  estimated_revenue: number;
  daily: { date: string; reservations: number; guests: number }[];
  top_tables: { code: string; zone: string; total: number }[];
}