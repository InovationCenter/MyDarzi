import { DevSettings, NativeModules } from 'react-native';

/** Reload JS so I18nManager.forceRTL layout takes effect. */
export function reloadApp(): void {
  if (typeof DevSettings?.reload === 'function') {
    DevSettings.reload();
    return;
  }
  const settings = NativeModules.DevSettings as { reload?: () => void } | undefined;
  settings?.reload?.();
}
