/**
 * Paste your Firebase web/app config here later.
 * Do not commit real secrets to public repos — prefer env / native google-services files.
 *
 * After filling this (and native Google services files):
 * 1. Set `appConfig.firebaseConfigured = true`
 * 2. Set `appConfig.authProvider = 'firebase'`
 * 3. Set `appConfig.analyticsEnabled = true` when ready
 * 4. `npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/analytics`
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

export function isFirebaseConfigReady(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}
