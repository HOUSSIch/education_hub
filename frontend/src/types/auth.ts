export type UserRole = 'ADMIN' | 'ENSEIGNANT' | 'ETUDIANT';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}
