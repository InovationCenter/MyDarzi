export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsService {
  logEvent(name: string, params?: AnalyticsParams): Promise<void>;
  setUserId(userId: string | null): Promise<void>;
  setUserProperty(name: string, value: string | null): Promise<void>;
  screenView(screenName: string, params?: AnalyticsParams): Promise<void>;
}
