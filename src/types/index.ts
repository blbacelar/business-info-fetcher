export interface SearchParams {
  keyword: string;
  location: string;
}

export interface BusinessResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
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
