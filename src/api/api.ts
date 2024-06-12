import axios, { AxiosInstance } from 'axios';
import { users } from './auth';
import { cases } from './cases';

const BASE_URL = 'http://localhost:8000/api/v1';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

export const setAuthToken = (token: string) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const api = {
  users,
  cases,
};