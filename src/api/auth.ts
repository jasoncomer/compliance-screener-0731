// authApi.ts

import { IBSApiResponse, IUser } from "../typings/interfaces";
import { IRegisterUserResponse, IUserCreate } from "../typings/user";

import { axiosInstance } from "./api";

// Function to authenticate a user
const authenticateUser = async (email: string, password: string): Promise<IBSApiResponse<{
  accessToken: string;
  refreshToken: string;
  user: IUser;
}>> => {
  const res = await axiosInstance.post('/auth/login', { email, password });
  return res.data;
}

// Function to register a new user
const registerUser = async (data: IUserCreate): Promise<IRegisterUserResponse> => {
  const res = await axiosInstance.post('/auth/signup', data);
  return res.data;
}

// Function to reset a user's password
const resetPassword = async (email: string): Promise<IBSApiResponse<null>> => {
  const res = await axiosInstance.post('/auth/forget-password', { email });
  return res.data;
}

// Function to delete a user account
const deleteAccount = async (userId: string): Promise<IBSApiResponse<null>> => {
  const res = await axiosInstance.delete(`/auth/remove/${userId}`);
  return res.data;
}

export const changePassword = async (currentPassword: string, newPassword: string): Promise<IBSApiResponse<null>> => {
  const res = await axiosInstance.post(`/auth/change-password`, { currentPassword, newPassword });
  return res.data;
}

export const resetPasswordWithToken = async (
  userId: string,
  token: string,
  password: string,
  confirmPassword: string
): Promise<IBSApiResponse<null>> => {
  const res = await axiosInstance.post(`/auth/reset-password/${userId}/${token}`, {
    password,
    confirmPassword
  });
  return res.data;
};

// Other auth API functions...
export const users = {
  authenticateUser,
  changePassword,
  registerUser,
  resetPassword,
  deleteAccount,
  resetPasswordWithToken,
};

export default {
  authenticateUser,
  registerUser,
  resetPassword,
  resetPasswordWithToken,
  changePassword,
  // ... other exports ...
};