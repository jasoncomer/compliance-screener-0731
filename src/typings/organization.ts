import { IUser } from './interfaces';

export type MemberRole = 'manager' | 'team_member';

export interface IMember {
  user?: IUser | null; // Optional for pending invitations
  email?: string; // Email for pending invitations
  role: MemberRole;
  status: 'pending' | 'active' | 'removed';
  joinedAt: string;
  invitedBy: string; // User ID who invited this member
}

export interface IOrganizationSettings {
  maxMembers: number;
  allowedDomains: string[];
}

export interface IOrganization {
  _id: string;
  name: string;
  description?: string;
  settings: IOrganizationSettings;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrganizationCreate {
  name: string;
  description?: string;
  settings?: Partial<IOrganizationSettings>;
}

export interface IOrganizationUpdate {
  name?: string;
  description?: string;
  settings?: Partial<IOrganizationSettings>;
}

export type OrganizationRole = 'owner' | 'manager' | 'team_member';

export interface IOrganizationMember {
  _id: string;
  organizationId: string;
  userId: string;
  email: string;
  role: OrganizationRole;
  status: 'active' | 'pending';
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrganizationInvite {
  emails: string[];
  role?: OrganizationRole;
}

export interface IOrganizationJoin {
  code: string;
  email: string;
}

export interface IInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: MemberRole;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string; // User ID who created the invitation
  createdAt: string;
  expiresAt: string;
  inviteCode: string; // Unique code for this invitation
} 