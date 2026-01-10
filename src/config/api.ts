// src/config/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Paystack Configuration
export const PAYSTACK_CONFIG = {
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  isTestMode: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.includes('test') ?? true,
  exchangeRate: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.includes('test') ? 100 : 1650,
};

export default API_BASE_URL;