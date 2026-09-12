import { ValidationError } from '../../shared/errors';
import { appConfig } from '../../config/appConfig';
import { isFirebaseConfigReady } from '../../config/firebase';
import type { AuthCredentials, AuthService, AuthUser } from './types';

/**
 * Firebase Auth adapter (scaffold).
 * Install `@react-native-firebase/auth` and fill `src/config/firebase.ts`
 * + native Google services files, then implement the SDK calls below.
 */
export class FirebaseAuthService implements AuthService {
  readonly provider = 'firebase' as const;

  private assertReady(): void {
    if (!appConfig.firebaseConfigured || !isFirebaseConfigReady()) {
      throw new ValidationError(
        'Firebase is not configured yet. Add your Firebase IDs in src/config/firebase.ts, set appConfig.firebaseConfigured = true, then install @react-native-firebase/auth.',
      );
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    this.assertReady();
    // TODO: return mapped user from @react-native-firebase/auth currentUser
    return null;
  }

  async signIn(_credentials: AuthCredentials): Promise<AuthUser> {
    this.assertReady();
    throw new ValidationError(
      'Firebase Auth sign-in is scaffolded. Wire auth().signInWithEmailAndPassword here.',
    );
  }

  async signUp(_credentials: AuthCredentials): Promise<AuthUser> {
    this.assertReady();
    throw new ValidationError(
      'Firebase Auth sign-up is scaffolded. Wire auth().createUserWithEmailAndPassword here.',
    );
  }

  async signOut(): Promise<void> {
    this.assertReady();
    // TODO: await auth().signOut();
  }
}
