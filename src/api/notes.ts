import { IBSApiResponse } from '../typings/interfaces';

import { axiosInstance } from './api';

export interface ICreateNote {
  content: string;
  transactionId?: string;
  address?: string;
  cospendId?: string;
  type?: 'general' | 'transaction' | 'address' | 'cluster';
}

export interface INote extends ICreateNote {
  _id: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  type: 'general' | 'transaction' | 'address' | 'cluster'; // Make required in INote
  creatorName?: string;
}

export interface IMarkNotesViewed {
  contextType: 'general' | 'transaction' | 'address' | 'cluster';
  contextId: string;
}

export interface IUnseenCountResponse {
  count: number;
  lastViewedAt?: string;
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

  // Get notes for a specific cluster (cospend_id)
  getClusterNotes: async (organizationId: string, cospendId: string): Promise<IBSApiResponse<INote[]>> => {
    const encodedCospendId = encodeURIComponent(cospendId);
    const response = await axiosInstance.get(`/organizations/${organizationId}/notes/cluster/${encodedCospendId}`);
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
  },

  // Mark notes as viewed for a specific user and context
  markAsViewed: async (organizationId: string, data: IMarkNotesViewed): Promise<IBSApiResponse<{ success: boolean }>> => {
    const response = await axiosInstance.post(`/organizations/${organizationId}/notes/mark-viewed`, data);
    return response.data;
  },

  // Get unseen notes count for a specific user and context
  getUnseenCount: async (organizationId: string, contextType: string, contextId: string): Promise<IBSApiResponse<IUnseenCountResponse>> => {
    const encodedContextId = encodeURIComponent(contextId);
    const response = await axiosInstance.get(`/organizations/${organizationId}/notes/unseen-count/${contextType}/${encodedContextId}`);
    return response.data;
  }
}; 