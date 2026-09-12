import AsyncStorage from '@react-native-async-storage/async-storage';
import { createId } from '../../shared/ids';
import { ValidationError } from '../../shared/errors';
import type { AuthCredentials, AuthService, AuthUser } from './types';

const USERS_KEY = '@mydarzi/local_users';
const SESSION_KEY = '@mydarzi/auth_session';

type StoredUser = {
  id: string;
  email: string;
  displayName: string | null;
  /** Local-only verifier — replaced by Firebase Auth when you switch providers. */
  passwordVerifier: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Lightweight verifier for offline local auth (not a substitute for Firebase). */
function verifier(password: string): string {
  let hash = 0;
  const salted = `mydarzi:${password}`;
  for (let i = 0; i < salted.length; i += 1) {
    hash = (hash * 31 + salted.charCodeAt(i)) | 0;
  }
  return `v1:${hash}`;
}

async function readUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    provider: 'local',
  };
}

/**
 * Offline-capable auth for Phase 1.
 * Swap to FirebaseAuthService when credentials are ready.
 */
export class LocalAuthService implements AuthService {
  readonly provider = 'local' as const;

  async getCurrentUser(): Promise<AuthUser | null> {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  async signIn(credentials: AuthCredentials): Promise<AuthUser> {
    const email = normalizeEmail(credentials.email);
    const password = credentials.password;
    if (!email || !password) {
      throw new ValidationError('Email and password are required.');
    }

    const users = await readUsers();
    const found = users.find(u => u.email === email);
    if (!found || found.passwordVerifier !== verifier(password)) {
      throw new ValidationError('Invalid email or password.');
    }

    const user = toAuthUser(found);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async signUp(credentials: AuthCredentials): Promise<AuthUser> {
    const email = normalizeEmail(credentials.email);
    const password = credentials.password;
    const displayName = credentials.displayName?.trim() || null;

    if (!email || !password) {
      throw new ValidationError('Email and password are required.');
    }
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters.');
    }

    const users = await readUsers();
    if (users.some(u => u.email === email)) {
      throw new ValidationError('An account with this email already exists.');
    }

    const stored: StoredUser = {
      id: createId(),
      email,
      displayName,
      passwordVerifier: verifier(password),
    };
    users.push(stored);
    await writeUsers(users);

    const user = toAuthUser(stored);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}
