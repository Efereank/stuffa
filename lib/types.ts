// ============================================================
// STUFFA TICKETS — Tipos
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'payment_uploaded'
  | 'verified'
  | 'rejected'
  | 'checked_in'
  | 'cancelled';

export type PaymentMethod = 'pago_movil' | 'zelle' | 'binance';

export type CustomerGender = 'M' | 'F' | 'O';

// ------------------------------------------------------------
// EVENTOS
// ------------------------------------------------------------

export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  event_date: string;
  event_time: string;
  venue: string;
  city: string;
  is_sold_out: boolean;
  available_tickets: number;
  total_capacity?: number;
  total_sold?: number;
}

export interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price_usd: number;
  benefits: string[];
  capacity: number;
  sold: number;
  available: number;
}

export interface EventDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  event_date: string;
  event_time: string;
  doors_open_at: string | null;
  venue: string;
  city: string;
  is_sold_out: boolean;
  ticket_types: TicketType[];
}

// ------------------------------------------------------------
// MÉTODOS DE PAGO
// ------------------------------------------------------------

export interface PaymentConfig {
  method: PaymentMethod;
  is_active?: boolean;
  config: {
    phone?: string;
    bank?: string;
    cedula?: string;
    owner?: string;
    email?: string;
    binance_id?: string;
  };
}

// ------------------------------------------------------------
// ÓRDENES
// ------------------------------------------------------------

export interface CreatedOrder {
  id: string;
  code: string;
  access_token: string;
  qr_token: string;
  status: OrderStatus;
  total_usd: number;
  total_bs: number;
  exchange_rate: number;
  event_name: string;
  event_date: string;
  event_time: string;
  ticket_name: string;
  quantity: number;
}

export interface OrderDetail {
  id: string;
  code: string;
  status: OrderStatus;
  qr_token: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  quantity: number;
  total_usd: number;
  total_bs: number | null;
  exchange_rate: number | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  event: {
    name: string;
    slug: string;
    event_date: string;
    event_time: string;
    venue: string;
    city: string;
    cover_url: string | null;
  };
  ticket_type: {
    name: string;
    price_usd: number;
  };
}

// ------------------------------------------------------------
// ADMIN
// ------------------------------------------------------------

export interface AdminEventRow {
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  event_date: string;
  event_time: string;
  venue: string;
  city: string;
  is_active: boolean;
  is_featured: boolean;
  is_sold_out: boolean;
  total_capacity: number;
  total_sold: number;
  verified_orders: number;
  pending_orders: number;
  revenue_usd: number;
}

export interface AdminOrderRow {
  id: string;
  code: string;
  status: OrderStatus;
  customer_name: string;
  customer_cedula: string;
  customer_phone: string;
  customer_email: string | null;
  quantity: number;
  men_count: number;
  women_count: number;
  total_usd: number;
  total_bs: number | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  payment_uploaded_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  checked_in_at: string | null;
  created_at: string;
  qr_token: string;
  access_token: string;
}

export interface AdminOrderWithEvent extends AdminOrderRow {
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
}

// ------------------------------------------------------------
// CHECK-IN
// ------------------------------------------------------------

export type CheckInResult =
  | { status: 'ok'; code: string; customer_name: string; quantity: number; event_name: string }
  | { status: 'already_checked_in'; code: string; customer_name: string; quantity: number; checked_in_at: string; event_name: string }
  | { status: 'not_verified'; code: string; customer_name: string; current_status: OrderStatus }
  | { status: 'not_found' };

// ------------------------------------------------------------
// REPORTES
// ------------------------------------------------------------

export interface MonthlyReport {
  year: number;
  month: number;
  from: string;
  to: string;

  total_events: number;
  total_orders: number;
  total_tickets_sold: number;
  total_checked_in: number;
  total_revenue_usd: number;
  total_revenue_bs: number;
  pending_orders: number;
  rejected_orders: number;

  by_payment_method: {
    method: string;
    orders: number;
    tickets: number;
    revenue: number;
  }[];

  by_event: {
    id: string;
    name: string;
    slug: string;
    event_date: string;
    tickets_sold: number;
    orders_count: number;
    revenue: number;
    capacity: number;
  }[];

  by_day: {
    date: string;
    tickets: number;
    revenue: number;
  }[];
}