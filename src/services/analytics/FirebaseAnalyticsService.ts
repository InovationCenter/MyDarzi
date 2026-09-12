import { appConfig } from '../../config/appConfig';
import { isFirebaseConfigReady } from '../../config/firebase';
import { logger } from '../../shared/logger';
import type { AnalyticsParams, AnalyticsService } from './types';

/**
 * Firebase Analytics adapter (scaffold).
 * Install `@react-native-firebase/analytics` after enabling analytics in Firebase console.
 */
export class FirebaseAnalyticsService implements AnalyticsService {
  private ready(): boolean {
    return appConfig.analyticsEnabled && appConfig.firebaseConfigured && isFirebaseConfigReady();
  }

  async logEvent(name: string, params?: AnalyticsParams): Promise<void> {
    if (!this.ready()) {
      logger.debug(`analytics(firebase-pending):event ${name}`, params);
      return;
    }
    // TODO: await analytics().logEvent(name, params);
  }

  async setUserId(userId: string | null): Promise<void> {
    if (!this.ready()) return;
    // TODO: await analytics().setUserId(userId);
  }

  async setUserProperty(name: string, value: string | null): Promise<void> {
    if (!this.ready()) return;
    // TODO: await analytics().setUserProperty(name, value);
  }

  async screenView(screenName: string, params?: AnalyticsParams): Promise<void> {
    if (!this.ready()) {
      logger.debug(`analytics(firebase-pending):screen ${screenName}`, params);
      return;
    }
    // TODO: await analytics().logScreenView({ screen_name: screenName, ... });
  }
}
