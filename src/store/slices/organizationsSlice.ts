import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { api } from '../../api/api';
import { IOrganization, IInvitation, EMemberRole, IOrganizationMember, EMemberStatus } from '../../typings/organization';
import { IUser } from '../../typings/interfaces';
import { RootState } from '../store';

interface OrganizationsState {
  orgs: {
    [id: string]: IOrganization;
  };
  invitations: {
    [id: string]: IInvitation;
  };
  users: {
    [id: string]: IUser;
  };
  activeOrganizationId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrganizationsState = {
  orgs: {},
  invitations: {},
  users: {},
  activeOrganizationId: null,
  loading: false,
  error: null,
};

export const fetchOrganizations = createAsyncThunk(
  'organizations/fetchOrganizations',
  async () => {
    const data = await api.organizations.list();
    return data;
  }
);

export const updateOrganization = createAsyncThunk(
  'organizations/updateOrganization',
  async ({ organizationId, data }: { organizationId: string; data: Partial<IOrganization> }) => {
    const response = await api.organizations.update(organizationId, data);
    return response.data;
  }
);

export const inviteMember = createAsyncThunk(
  'organizations/inviteMember',
  async ({ organizationId, email, role }: { organizationId: string; email: string; role: EMemberRole }) => {
    await api.organizations.invite(organizationId, {
      emails: [email],
      role,
    });
    return { email, role, organizationId };
  }
);

export const removeMember = createAsyncThunk(
  'organizations/removeMember',
  async ({ organizationId, memberId }: { organizationId: string; memberId: string }) => {
    await api.organizations.removeMember(organizationId, memberId);
    return memberId;
  }
);

export const updateMemberRole = createAsyncThunk(
  'organizations/updateMemberRole',
  async ({ organizationId, memberId, role }: { organizationId: string; memberId: string; role: EMemberRole }) => {
    await api.organizations.updateMemberRole(organizationId, memberId, role);
    return { memberId, role };
  }
);

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<string | null>) => {
      state.activeOrganizationId = action.payload;
    },
    addInvitation: (state, action: PayloadAction<IInvitation>) => {
      const invitation = action.payload;
      state.invitations[invitation.id] = invitation;
    },
    revokeInvitation: (state, action: PayloadAction<string>) => {
      const invitationId = action.payload;
      delete state.invitations[invitationId];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, action) => {
        state.loading = false;

        // Normalize organizations
        const organizationsById: Record<string, IOrganization> = {};
        const organizationIds: string[] = [];

        action.payload.organizations.forEach((org: IOrganization) => {
          organizationsById[org._id] = org;
          organizationIds.push(org._id);
        });

        state.orgs = organizationsById;

        // Set current organization to the first one if not already set
        if (organizationIds.length > 0 && !state.activeOrganizationId) {
          state.activeOrganizationId = organizationIds[0];
        }

        // Normalize users
        const usersById: Record<string, IUser> = {};
        action.payload.users.forEach((user: IUser) => {
          if (user._id) {
            usersById[user._id] = user;
          }
        });
        state.users = usersById;
      })
      .addCase(fetchOrganizations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch organizations';
      })
      .addCase(updateOrganization.fulfilled, (state, action) => {
        const updatedOrg = action.payload;
        state.orgs[updatedOrg._id] = updatedOrg;
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const { memberId, role } = action.payload;
        const orgId = action.meta.arg.organizationId;
        if (orgId && state.orgs[orgId]) {
          const memberIndex = state.orgs[orgId].members.findIndex(m => m.userId === memberId);
          if (memberIndex !== -1) {
            state.orgs[orgId].members[memberIndex].role = role;
          }
        }
      });
  },
});

// Selectors
export const selectActiveOrganization = createSelector(
  (state: RootState) => state.organizations,
  (orgState: OrganizationsState) => {
    return orgState.activeOrganizationId ? orgState.orgs[orgState.activeOrganizationId] : null;
  }
);

export const selectAllOrganizations = (state: { organizations: OrganizationsState }) =>
  Object.values(state.organizations.orgs);

export const selectOrganizationById = (state: { organizations: OrganizationsState }, organizationId: string) =>
  state.organizations.orgs[organizationId];

export const selectCurrentOrganization = (state: { organizations: OrganizationsState }) =>
  state.organizations.activeOrganizationId
    ? state.organizations.orgs[state.organizations.activeOrganizationId]
    : null;

export const selectPendingInvitations = (state: { organizations: OrganizationsState }) =>
  Object.values(state.organizations.invitations);

export const selectIsLoading = (state: { organizations: OrganizationsState }) =>
  state.organizations.loading;

export const selectActiveOrgMembers = createSelector(
  selectActiveOrganization,
  (state: RootState) => state.organizations.users,
  (org, users) => {
    if (!org) return [];

    return org.members.map((member) => {
      const user = member.userId ? users[member.userId] : null;
      return {
        ...member,
        ...(user ? user : {})
      } as IOrganizationMember;
    })
      .sort((a, b) => {
        // show admin first
        if (a.role === EMemberRole.ADMIN && b.role !== EMemberRole.ADMIN) return -1;
        if (a.role !== EMemberRole.ADMIN && b.role === EMemberRole.ADMIN) return 1;
        // show pending last
        if (a.status === 'pending' && b.status !== 'pending') return 1;
        if (a.status !== 'pending' && b.status === 'pending') return -1;
        return 0;
      })
      .filter((member) => member.status !== EMemberStatus.REMOVED && member.status !== EMemberStatus.PENDING);
  }
);

export const selectActiveOrgMembersMap = createSelector(
  selectActiveOrgMembers,
  (members) => {
    return members.reduce((acc, member) => {
      if (member.userId) {
        acc[member.userId] = member;
      }
      return acc;
    }, {} as Record<string, IOrganizationMember>);
  }
);


export const { setCurrentOrganization, addInvitation, revokeInvitation } = organizationsSlice.actions;
export default organizationsSlice.reducer; 