export type AppLanguage = 'en' | 'ur';

export type TranslationKey = keyof typeof import('./en').en;

export type TranslationDict = Record<string, string>;
