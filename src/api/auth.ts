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
const resetPassword = async (username: string): Promise<boolean> => {
  const res = await axiosInstance.post('/users/reset-password', { username });
  return res.data;
}

// Other auth API functions...
export const users = {
  authenticateUser,
  registerUser,
  resetPassword,
};