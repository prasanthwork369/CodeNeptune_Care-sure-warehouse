export type UserRole = "picker" | "checker" | "dispatcher";

export interface User {
  id: string;
  email: string;
  phone?: string;
  createdAt?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string | null;
  };
  roles: (UserRole | string | { name?: string; role?: string })[];
  permissions?: string[];
}

/** Returns roles already normalised to lowercase from the auth store */
export const getUserRoles = (roles: string[]): UserRole[] =>
  roles.filter(Boolean) as UserRole[];
