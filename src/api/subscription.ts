import {
  IOrganizationSubscription,
  ISubscriptionTier,
} from '../typings/subscription';

import { axiosInstance } from './api';

export const subscription = {
  /**
   * Get all available subscription tiers
   */
  getSubscriptionTiers: async (): Promise<ISubscriptionTier[]> => {
    const response = await axiosInstance.get('/subscriptions/tiers');
    return response.data.data;
  },

  /**
   * Get an organization's current subscription
   */
  getOrganizationSubscription: async (organizationId: string): Promise<IOrganizationSubscription> => {
    const response = await axiosInstance.get(`/subscriptions/organizations/${organizationId}`);
    return response.data.data;
  },

  /**
   * Create a new subscription for an organization
   */
  createOrganizationSubscription: async (
    organizationId: string,
    tierId: string,
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<IOrganizationSubscription> => {
    const response = await axiosInstance.post('/subscriptions/organizations', {
      organizationId,
      tierId,
      billingPeriod,
    });
    return response.data.data;
  },

  /**
   * Update an organization's subscription
   */
  updateOrganizationSubscription: async (
    organizationId: string,
    tierId: string,
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<IOrganizationSubscription> => {
    const response = await axiosInstance.put(`/subscriptions/organizations/${organizationId}`, {
      tierId,
      billingPeriod,
    });
    return response.data.data;
  },

  /**
   * Cancel an organization's subscription
   */
  cancelOrganizationSubscription: async (
    organizationId: string,
    cancelImmediately: boolean = false
  ): Promise<{ subscription: IOrganizationSubscription; message: string }> => {
    const response = await axiosInstance.delete(`/subscriptions/organizations/${organizationId}`, {
      data: { cancelImmediately },
    });
    return response.data.data;
  },
}; 