import axios, { AxiosInstance } from 'axios';

import { config } from '@/config/config';
import { storage } from '../utils/storage';

import { users } from './auth';
import { blockchain } from './blockchain';
import { compliance } from './compliance';
import { contactSales } from './contactSales';
import { crypto } from './crypto';
import { notesApi } from './notes';
import { organizations } from './organizations';
import { riskScoring } from './riskScoring';
import { socialMedia } from './socialMedia';
import { sot } from './sot';
import { subscription } from './subscription';

export const BASE_API_URL = config.BASE_API_URL;

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 60000,
});

export const setAuthToken = (token: string) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

export const api = {
  blockchain,
  compliance,
  contactSales,
  crypto,
  organizations,
  riskScoring,
  sot,
  socialMedia,
  subscription,
  users,
  notes: notesApi,
};

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use((config) => {
  const token = storage.auth.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});
