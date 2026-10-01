export type UserStatus = 'pending' | 'active' | 'suspended' | 'disabled';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  account_status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface AuthPayload {
  user: User;
}

export interface AccountUpdatePayload {
  name?: string;
  email?: string;
}

export interface ResetPasswordPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ValidationErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
