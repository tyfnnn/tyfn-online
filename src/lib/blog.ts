import { getCollection, type CollectionEntry } from 'astro:content';
import { getRelativeLocaleUrl } from 'astro:i18n';
import type { Lang } from '../i18n/t';

export type BlogEntry = CollectionEntry<'blog'>;

export function postSlug(entry: BlogEntry): string {
  return entry.id.replace(/^(en|de)\//, '').replace(/\.(md|mdx)$/, '');
}

export function postHref(lang: Lang, entry: BlogEntry): string {
  return getRelativeLocaleUrl(lang, `/blog/${postSlug(entry)}/`);
}

export function postPathname(entry: BlogEntry): string {
  return `/blog/${postSlug(entry)}/`;
}

export async function getBlogPosts(lang: Lang): Promise<BlogEntry[]> {
  const all = await getCollection('blog', (entry) => {
    if (entry.data.lang !== lang) return false;
    if (entry.data.draft && !import.meta.env.DEV) return false;
    return true;
  });
  return all.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
}

export async function findTranslationPath(
  entry: BlogEntry,
  targetLang: Lang,
): Promise<string | null> {
  const key = entry.data.translationKey;
  if (!key) return null;
  const candidates = await getCollection('blog', (e) => {
    if (e.data.lang !== targetLang) return false;
    if (e.data.translationKey !== key) return false;
    if (e.data.draft && !import.meta.env.DEV) return false;
    return true;
  });
  const match = candidates[0];
  if (!match) return null;
  return postPathname(match);
}

const WORDS_PER_MINUTE = 200;

export function readingTimeMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatReadingTime(
  body: string | undefined,
  template: string,
): string {
  const minutes = readingTimeMinutes(body);
  return template.replace('{n}', String(minutes));
}

export function formatDate(date: Date, lang: Lang): string {
  return date.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
