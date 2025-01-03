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
