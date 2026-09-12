/**
 * App feature flags / providers.
 * Flip `authProvider` to `'firebase'` after you add Firebase credentials.
 */
export type AuthProviderKind = 'local' | 'firebase';

export const appConfig = {
  /** Use `'local'` until Firebase is configured; then set `'firebase'`. */
  authProvider: 'local' as AuthProviderKind,
  /** Keep false until Firebase Analytics is wired. */
  analyticsEnabled: false,
  /** Set true after adding google-services.json / GoogleService-Info.plist. */
  firebaseConfigured: false,
};
