import { appConfig } from '../../config/appConfig';
import { FirebaseAnalyticsService } from './FirebaseAnalyticsService';
import { NoopAnalyticsService } from './NoopAnalyticsService';
import type { AnalyticsService } from './types';

export function createAnalyticsService(): AnalyticsService {
  if (appConfig.analyticsEnabled) {
    return new FirebaseAnalyticsService();
  }
  return new NoopAnalyticsService();
}

export type { AnalyticsService, AnalyticsParams } from './types';
