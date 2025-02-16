import axios, { AxiosInstance } from 'axios';
import { users } from './auth';
import { cases } from './cases';
import { blockchain } from './blockchain';
import { sot } from './sot';

const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://api.blockscout.ai/api/v1' : 'http://localhost:8000/api/v1';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

export const setAuthToken = (token: string) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const api = {
  blockchain,
  cases,
  users,
  sot,
};

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
