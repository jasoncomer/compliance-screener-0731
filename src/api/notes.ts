import { axiosInstance } from './api';
import { IBSApiResponse } from '../typings/interfaces';

export interface INote {
  _id: string;
  organizationId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  address?: string;
  type: 'general' | 'transaction' | 'address';
  creatorName?: string;
}

export interface ICreateNote {
  content: string;
  transactionId?: string;
  address?: string;
  type?: 'general' | 'transaction' | 'address';
}

export const notesApi = {
  // Get all notes for the organization
  list: async (organizationId: string): Promise<IBSApiResponse<INote[]>> => {
    const response = await axiosInstance.get(`/organizations/${organizationId}/notes`);
    return response.data;
  },

  // Get notes for a specific transaction
  getTransactionNotes: async (organizationId: string, transactionId: string): Promise<IBSApiResponse<INote[]>> => {
    const encodedTransactionId = encodeURIComponent(transactionId);
    const response = await axiosInstance.get(`/organizations/${organizationId}/notes/transaction/${encodedTransactionId}`);
    return response.data;
  },

  // Get notes for a specific address
  getAddressNotes: async (organizationId: string, address: string): Promise<IBSApiResponse<INote[]>> => {
    const encodedAddress = encodeURIComponent(address);
    const response = await axiosInstance.get(`/organizations/${organizationId}/notes/address/${encodedAddress}`);
    return response.data;
  },

  // Create a new note
  create: async (organizationId: string, data: ICreateNote): Promise<IBSApiResponse<INote>> => {
    const response = await axiosInstance.post(`/organizations/${organizationId}/notes`, data);
    return response.data;
  },

  // Update a note
  update: async (organizationId: string, noteId: string, data: { content: string }): Promise<IBSApiResponse<INote>> => {
    const response = await axiosInstance.patch(`/organizations/${organizationId}/notes/${noteId}`, {
      content: data.content
    });
    return response.data;
  },

  // Delete a note
  delete: async (organizationId: string, noteId: string): Promise<IBSApiResponse<null>> => {
    const response = await axiosInstance.delete(`/organizations/${organizationId}/notes/${noteId}`);
    return response.data;
  }
}; 