import { IBSApiResponse, IUser } from '../typings/interfaces';
import {
  EMemberRole,
  IInvitation,
  IInviteResponse,
  IOrganization,
  IOrganizationCreate,
  IOrganizationInvite,
  IOrganizationJoin,
  IOrganizationMember,
  IOrganizationUpdate} from '../typings/organization';

import { axiosInstance } from './api';

export const organizations = {
  // List organizations where user is a member
  list: async (): Promise<{ organizations: IOrganization[], users: IUser[] }> => {
    const { data } = await axiosInstance.get('/organizations');
    return data.data;
  },

  // Create a new organization
  create: async (data: IOrganizationCreate): Promise<IBSApiResponse<IOrganization>> => {
    const response = await axiosInstance.post('/organizations', data);
    return response.data;
  },

  // Get organization details
  get: async (organizationId: string): Promise<IBSApiResponse<IOrganization>> => {
    const response = await axiosInstance.get(`/organizations/${organizationId}`);
    return response.data;
  },

  // Update organization
  update: async (organizationId: string, data: IOrganizationUpdate): Promise<IBSApiResponse<IOrganization>> => {
    const response = await axiosInstance.patch(`/organizations/${organizationId}`, data);
    return response.data;
  },

  // Delete organization
  delete: async (organizationId: string): Promise<IBSApiResponse<null>> => {
    const response = await axiosInstance.delete(`/organizations/${organizationId}`);
    return response.data;
  },

  // Invite members to organization
  invite: async (organizationId: string, data: IOrganizationInvite): Promise<IBSApiResponse<IInviteResponse>> => {
    const response = await axiosInstance.post(`/organizations/${organizationId}/invite`, data);
    return response.data;
  },

  // Join organization with invite code
  join: async (data: IOrganizationJoin): Promise<IBSApiResponse<IOrganization>> => {
    const response = await axiosInstance.post('/organizations/join', data);
    return response.data;
  },

  // List organization members
  listMembers: async (organizationId: string): Promise<IOrganizationMember[]> => {
    const response = await axiosInstance.get(`/organizations/${organizationId}/members`);
    return response.data.data;
  },

  // Update member role
  updateMemberRole: async (
    organizationId: string,
    memberId: string,
    role: EMemberRole
  ): Promise<IBSApiResponse<IOrganizationMember>> => {
    const response = await axiosInstance.patch(
      `/organizations/${organizationId}/members/${memberId}/role`,
      { role }
    );
    return response.data;
  },

  // Remove member from organization
  removeMember: async (organizationId: string, memberId: string): Promise<IBSApiResponse<null>> => {
    const response = await axiosInstance.delete(`/organizations/${organizationId}/members/${memberId}`);
    return response.data;
  },

  // Get user's pending invitations
  getUserPendingInvitations: async (): Promise<IBSApiResponse<IInvitation[]>> => {
    const response = await axiosInstance.get('/organizations/user/invitations');
    return response.data;
  },

  // Respond to an invitation (accept or reject)
  respondToInvitation: async (
    organizationId: string, 
    invitationId: string, 
    action: 'accept' | 'reject'
  ): Promise<IBSApiResponse<IOrganization>> => {
    const response = await axiosInstance.post(`/organizations/${organizationId}/invitations/${invitationId}/respond`, {
      action
    });
    return response.data;
  },

  // Revoke an invitation
  revokeInvitation: async (
    organizationId: string,
    invitationId: string
  ): Promise<IBSApiResponse<null>> => {
    const response = await axiosInstance.delete(`/organizations/${organizationId}/invitations/${invitationId}`);
    return response.data;
  }
}; 