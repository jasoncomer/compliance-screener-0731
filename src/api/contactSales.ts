import { axiosInstance } from './api';

export interface IContactSalesFormData {
  email: string;
  company: string;
  companySize: string;
  message: string;
}

export interface IContactSalesResponse {
  id: string;
  status: string;
  message: string;
}

export const contactSales = {
  /**
   * Submit contact sales form
   */
  submit: async (data: IContactSalesFormData): Promise<IContactSalesResponse> => {
    const response = await axiosInstance.post('/contact-sales/submit', data);
    return response.data.data;
  },
}; 