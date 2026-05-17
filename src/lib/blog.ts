import { statSync } from 'node:fs';
import { extname, join } from 'node:path';
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

const HERO_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export interface HeroEnclosure {
  url: string;
  length: number;
  type: string;
}

export function heroEnclosure(
  heroImage: string | undefined,
  site: URL,
): HeroEnclosure | undefined {
  if (!heroImage) return undefined;
  const [pathname] = heroImage.split('?');
  const type =
    HERO_MIME_TYPES[extname(pathname).toLowerCase()] ??
    'application/octet-stream';
  const length = statSync(join(process.cwd(), 'public', pathname)).size;
  return {
    url: new URL(heroImage, site).toString(),
    length,
    type,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function heroMediaXml(
  enclosure: HeroEnclosure | undefined,
  title: string,
): string {
  if (!enclosure) return '';
  const url = escapeXml(enclosure.url);
  const type = escapeXml(enclosure.type);
  const alt = escapeXml(title);
  return (
    `<media:content medium="image" url="${url}" type="${type}" fileSize="${enclosure.length}">` +
    `<media:title type="plain">${alt}</media:title>` +
    `</media:content>` +
    `<media:thumbnail url="${url}" />`
  );
}

export function heroImageHtml(
  enclosure: HeroEnclosure | undefined,
  title: string,
): string {
  if (!enclosure) return '';
  return `<p><img src="${escapeXml(enclosure.url)}" alt="${escapeXml(title)}" /></p>`;
}
