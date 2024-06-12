export interface IRegisterUserResponse {
  success: boolean,
  error: boolean,
  message: string;
  status: number,
  data: {
    user: {
      accessToken: string;
      refreshToken: string;
      verifyEmailLink: string;
    }
  }
}

export interface IUserCreate {
  name: string;
  surname: string;
  email: string;
  password: string;
}
