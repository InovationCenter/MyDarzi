import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en, type EnKey } from './en';
import { ur } from './ur';
import type { AppLanguage } from './types';
import { reloadApp } from '../shared/reloadApp';

const STORAGE_KEY = '@mydarzi/language';

type I18nContextValue = {
  language: AppLanguage;
  isRTL: boolean;
  ready: boolean;
  t: (key: EnKey, params?: Record<string, string | number>) => string;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

const dictionaries = { en, ur } as const;

const I18nContext = createContext<I18nContextValue | null>(null);

function formatTemplate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : '',
  );
}

async function applyRtl(language: AppLanguage): Promise<boolean> {
  const shouldRtl = language === 'ur';
  const changed = I18nManager.isRTL !== shouldRtl;
  I18nManager.allowRTL(shouldRtl);
  I18nManager.forceRTL(shouldRtl);
  return changed;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const next: AppLanguage = stored === 'ur' ? 'ur' : 'en';
        if (cancelled) {
          return;
        }
        setLanguageState(next);
        const rtlChanged = await applyRtl(next);
        if (rtlChanged) {
          // Persist native RTL before first paint of the wrong direction.
          reloadApp();
          return;
        }
        if (!cancelled) {
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const t = useCallback(
    (key: EnKey, params?: Record<string, string | number>) => {
      const dict = dictionaries[language];
      const template = dict[key] ?? en[key] ?? String(key);
      return formatTemplate(template, params);
    },
    [language],
  );

  const setLanguage = useCallback(async (next: AppLanguage) => {
    setLanguageState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
    const rtlChanged = await applyRtl(next);
    if (rtlChanged) {
      // Native layout direction only updates after a JS reload.
      setTimeout(() => reloadApp(), 80);
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      isRTL: language === 'ur',
      ready,
      t,
      setLanguage,
    }),
    [language, ready, t, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
