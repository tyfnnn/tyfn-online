import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getRelativeLocaleUrl } from 'astro:i18n';
import {
  getBlogPosts,
  heroEnclosure,
  heroImageHtml,
  heroMediaXml,
  postSlug,
} from '../lib/blog';
import { useTranslations } from '../i18n/t';

export async function GET(context: APIContext) {
  const lang = 'en' as const;
  const t = useTranslations(lang);
  const posts = await getBlogPosts(lang);
  const site = context.site!;

  return rss({
    title: `Tayfun Ilker — ${t('blog.index.title')}`,
    description: t('blog.index.subtitle'),
    site,
    xmlns: { media: 'http://search.yahoo.com/mrss/' },
    items: posts.map((post) => {
      const enclosure = heroEnclosure(post.data.heroImage, site);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: getRelativeLocaleUrl(lang, `/blog/${postSlug(post)}/`),
        categories: post.data.tags,
        content: heroImageHtml(enclosure, post.data.title) + post.data.description,
        ...(enclosure && { enclosure }),
        customData: heroMediaXml(enclosure, post.data.title),
      };
    }),
    customData: `<language>en-US</language>`,
  });
}
