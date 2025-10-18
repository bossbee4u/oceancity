export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager';
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  code: string;
  full_name: string;
  phone?: string;
  gatepass?: string | null;
  waqala?: string | null;
  truck_id?: string | null;
  trailer_id?: string | null;
  company_id?: string | null;
  status: 'active' | 'vacation' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  code: string;
  short_name: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Truck {
  id: string;
  truck_number: string;
  type: string;
  model: number;
  expiry_date: string;
  status: 'active' | 'empty';
  vg_id?: string;
  longitude?: number;
  latitude?: number;
  tracking_link?: string;
  created_at: string;
  updated_at: string;
}

export interface Trailer {
  id: string;
  trailer_number: string;
  type: 'Box' | 'Flatbed' | 'Curtainside' | 'TIR Box' | 'TIR BL' | 'Balmer' | 'Reefer' | 'Reefer TIR';
  model: number;
  expiry_date: string;
  status: 'active' | 'empty';
  color: 'red' | 'blue' | 'white' | 'black' | 'silver' | 'orange' | 'yellow';
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  doc_no: string;
  loading_date: string;
  driver_id?: string;
  truck_id?: string;
  trailer_id?: string;
  company_id: string;
  customer_id?: string;
  origin: string;
  destination: string;
  amount?: number;
  gross_weight?: number;
  net_weight?: number;
  status: 'waiting' | 'submitted';
  created_at: string;
  updated_at: string;
}
