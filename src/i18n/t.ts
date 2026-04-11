import en from './en.json';
import de from './de.json';

const dictionaries = { en, de } as const;
export type Lang = keyof typeof dictionaries;

type Dict = typeof en;
type DotKey<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? DotKey<T[K], `${P}${K}.`>
    : `${P}${K}`;
}[keyof T & string];
export type TranslationKey = DotKey<Dict>;

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey): string {
    const parts = key.split('.');
    let value: unknown = dictionaries[lang];
    for (const part of parts) {
      value = (value as Record<string, unknown> | undefined)?.[part];
    }
    if (typeof value !== 'string') {
      let fallback: unknown = dictionaries.en;
      for (const part of parts) {
        fallback = (fallback as Record<string, unknown> | undefined)?.[part];
      }
      return typeof fallback === 'string' ? fallback : key;
    }
    return value;
  };
}
