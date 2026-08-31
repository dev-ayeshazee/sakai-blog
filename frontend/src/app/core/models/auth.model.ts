export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}
