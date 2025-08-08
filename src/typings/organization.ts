export enum EMemberRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TEAM_MEMBER = 'team_member',
}

export enum EMemberStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

export interface IMember {
  _id?: string; // MongoDB document ID
  userId?: string | null; // Optional for pending invitations
  email?: string; // Email for pending invitations
  role: EMemberRole;
  status: EMemberStatus;
  joinedAt: string;
  invitedBy: string; // User ID who invited this member
}

export interface IOrganizationSettings {
  maxMembers: number;
  allowedDomains: string[];
  inviteCode: string;
  allowCSAM: boolean;
  riskScoreThreshold: number;
  transactionThreshold: number;
}

export interface IOrganization {
  _id: string;
  name: string;
  description?: string;
  email: string; // Organization email address
  settings: IOrganizationSettings;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: IMember[];
}

export interface IOrganizationCreate {
  name: string;
  description?: string;
  email?: string; // Optional, will default to owner's email
  settings?: Partial<IOrganizationSettings>;
}

export interface IOrganizationUpdate {
  name?: string;
  description?: string;
  email?: string; // Allow updating organization email
  settings?: Partial<IOrganizationSettings>;
}

export interface IOrganizationMember extends IMember {
  email: string;
  name: string;
  surname: string;
  status: EMemberStatus;
}

export interface IOrganizationInvite {
  emails: string[];
  role?: EMemberRole;
}

export interface IOrganizationJoin {
  code: string;
  email: string;
}

export interface IInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: EMemberRole;
  status: EMemberStatus;
  invitedBy: string; // User ID who created the invitation
  createdAt: string;
  expiresAt: string;
  inviteCode: string; // Unique code for this invitation
}

export interface IInviteResponse {
  inviteResults: Array<{ email: string; status: string }>;
  organization: IOrganization;
}