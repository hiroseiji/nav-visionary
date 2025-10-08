export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "org_admin";
  organizationId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface Organization {
  _id: string;
  organizationName: string;
  alias?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
