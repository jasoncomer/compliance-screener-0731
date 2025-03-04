import { IUser } from './interfaces';

export type MemberRole = 'manager' | 'team_member';

export interface IMember {
  user: IUser;
  role: MemberRole;
  status: 'pending' | 'active' | 'removed';
  joinedAt: string;
  invitedBy: string; // User ID who invited this member
}

export interface IOrganization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string; // User ID of the organization owner
  members: IMember[];
  settings: {
    maxMembers: number;
    allowedDomains?: string[]; // Email domains that are allowed to join
    inviteCode?: string; // Optional invite code for direct joins
  };
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