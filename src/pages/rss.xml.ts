import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getRelativeLocaleUrl } from 'astro:i18n';
import { getBlogPosts, postSlug } from '../lib/blog';
import { useTranslations } from '../i18n/t';

export async function GET(context: APIContext) {
  const lang = 'en' as const;
  const t = useTranslations(lang);
  const posts = await getBlogPosts(lang);

  return rss({
    title: `Tayfun Ilker — ${t('blog.index.title')}`,
    description: t('blog.index.subtitle'),
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: getRelativeLocaleUrl(lang, `/blog/${postSlug(post)}/`),
      categories: post.data.tags,
    })),
    customData: `<language>en-US</language>`,
  });
}
