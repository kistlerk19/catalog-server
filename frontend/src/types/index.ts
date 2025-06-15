export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string;
  created_by: number;
  creator_username: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PaginationData {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_prev: boolean;
  has_next: boolean;
  prev_num: number;
  next_num: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationData;
}

export interface SearchInfo {
  query: string;
  total_found: number;
  total_products: number;
}

export interface SearchResponse extends ProductsResponse {
  search_info: SearchInfo;
}