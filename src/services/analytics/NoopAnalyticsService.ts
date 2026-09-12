import { logger } from '../../shared/logger';
import type { AnalyticsParams, AnalyticsService } from './types';

/** Safe default — no network. Swap for FirebaseAnalyticsService later. */
export class NoopAnalyticsService implements AnalyticsService {
  async logEvent(name: string, params?: AnalyticsParams): Promise<void> {
    logger.debug(`analytics:event ${name}`, params);
  }

  async setUserId(userId: string | null): Promise<void> {
    logger.debug('analytics:setUserId', { userId });
  }

  async setUserProperty(name: string, value: string | null): Promise<void> {
    logger.debug('analytics:setUserProperty', { name, value });
  }

  async screenView(screenName: string, params?: AnalyticsParams): Promise<void> {
    logger.debug(`analytics:screen ${screenName}`, params);
  }
}
