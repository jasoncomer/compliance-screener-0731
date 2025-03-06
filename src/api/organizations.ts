import { axiosInstance } from './api';
import { IBSApiResponse } from '../typings/interfaces';
import {
  IOrganization,
  IOrganizationCreate,
  IOrganizationUpdate,
  IOrganizationMember,
  IOrganizationInvite,
  IOrganizationJoin,
  OrganizationRole
} from '../typings/organization';

export const organizations = {
  // List organizations where user is a member
  list: async (): Promise<IBSApiResponse<IOrganization[]>> => {
    const response = await axiosInstance.get('/organizations');
    return response.data;
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
  invite: async (organizationId: string, data: IOrganizationInvite): Promise<IBSApiResponse<null>> => {
    const response = await axiosInstance.post(`/organizations/${organizationId}/invite`, data);
    return response.data;
  },

  // Join organization with invite code
  join: async (data: IOrganizationJoin): Promise<IBSApiResponse<IOrganization>> => {
    const response = await axiosInstance.post('/organizations/join', data);
    return response.data;
  },

  // List organization members
  listMembers: async (organizationId: string): Promise<IBSApiResponse<IOrganizationMember[]>> => {
    const response = await axiosInstance.get(`/organizations/${organizationId}/members`);
    return response.data;
  },

  // Update member role
  updateMemberRole: async (
    organizationId: string,
    memberId: string,
    role: OrganizationRole
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
  }
}; 