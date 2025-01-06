export interface SearchParams {
  keyword: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface BusinessResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  whatsapp?: string;
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  whatsapp?: string;
}
