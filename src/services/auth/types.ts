export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  provider: 'local' | 'firebase';
};

export type AuthCredentials = {
  email: string;
  password: string;
  displayName?: string;
};

export interface AuthService {
  readonly provider: 'local' | 'firebase';
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(credentials: AuthCredentials): Promise<AuthUser>;
  signUp(credentials: AuthCredentials): Promise<AuthUser>;
  signOut(): Promise<void>;
}
