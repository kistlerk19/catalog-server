import axios from 'axios';
import { User, Product, ProductsResponse, SearchResponse } from '../types';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
// Set default headers for all requests
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

api.interceptors.request.use(
  (config) => {
    // Get the latest token on each request
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Enable sending cookies with requests
    config.withCredentials = true;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear token
      console.log('Unauthorized request - clearing token');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    console.log('Logging in with:', { username });
    const response = await api.post('/auth/login', { username, password });
    console.log('Login response:', response.data);
    return response.data;
  },
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    console.log('Getting profile with token:', localStorage.getItem('token'));
    const response = await api.get('/auth/profile');
    console.log('Profile response:', response.data);
    return response.data;
  },
  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getProducts: async (params?: any): Promise<ProductsResponse> => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  searchProducts: async (params?: any): Promise<SearchResponse> => {
    const response = await api.get('/products/search', { params });
    return response.data;
  },
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  createProduct: async (product: Partial<Product>) => {
    const response = await api.post('/products', product);
    return response.data;
  },
  updateProduct: async (id: number, product: Partial<Product>) => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/products/categories');
    return response.data.categories;
  },
  getSuggestions: async (query: string): Promise<string[]> => {
    const response = await api.get('/products/search/suggestions', { params: { q: query } });
    return response.data.suggestions;
  },
  getMyProducts: async (params?: any): Promise<ProductsResponse> => {
    const response = await api.get('/my/products', { params });
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  updateUser: async (id: number, data: Partial<User>) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },
  getAllProducts: async (params?: any) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },
};

export default api;