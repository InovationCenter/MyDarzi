import { appConfig } from '../../config/appConfig';
import { FirebaseAuthService } from './FirebaseAuthService';
import { LocalAuthService } from './LocalAuthService';
import type { AuthService } from './types';

export function createAuthService(): AuthService {
  if (appConfig.authProvider === 'firebase') {
    return new FirebaseAuthService();
  }
  return new LocalAuthService();
}

export type { AuthService, AuthUser, AuthCredentials } from './types';
