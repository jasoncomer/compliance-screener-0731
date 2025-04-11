import { createSlice } from '@reduxjs/toolkit';
import { IOrganization } from '../../typings/organization';

interface OrganizationState {
  organization: IOrganization | null;
}

const initialState: OrganizationState = {
  organization: null,
};

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setOrganization: (state, action) => {
      state.organization = action.payload;
    },
  },
});

export const { setOrganization } = organizationSlice.actions;
export default organizationSlice.reducer; 