export interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  category: 'engine' | 'bodywork' | 'electrical' | 'wheels' | 'restoration' | 'assembly' | 'testing';
  date: string;
  tags: string[];
  timeline_event_id?: string | null;
  isBeforePhoto?: boolean;
  isAfterPhoto?: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  category: string;
  image_url?: string;
  video_url?: string;
}

export interface TechnicalSpec {
  id: string;
  category: 'engine' | 'electrical' | 'bodywork' | 'performance';
  part: string;
  original_spec?: string;
  restored_spec?: string;
  action: string;
  status: 'restored' | 'replaced' | 'upgraded';
  notes?: string;
  created_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartCost {
  id: string;
  part_name: string;
  category: 'engine' | 'bodywork' | 'electrical' | 'wheels' | 'transmission' | 'suspension' | 'accessories' | 'tools' | 'labour' | 'administrative' | 'purchase';
  condition: 'new' | 'used' | 'refurbished';
  price: number;
  currency: string;
  supplier?: string;
  purchase_date: string;
  invoice_id?: string;
  timeline_event_id?: string | null;
  notes?: string;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  supplier: string;
  total_amount: number;
  currency: string;
  invoice_date: string;
  google_drive_url?: string;
  description?: string;
  created_at?: string;
}