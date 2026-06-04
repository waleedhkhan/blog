import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

import rss from '@astrojs/rss';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts');
  const site = context.site ?? 'https://waleed.de';

  return rss({
    title: 'Waleed\'s Blog',
    description: 'Food for thoughts or just Waleed\'s passing whims in form of writings',
    site: site,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.publishedAt,
      description: post.data.subtitle,
      link: `/posts/${post.slug}`,
    })),
    customData: `<language>en-us</language>`,
  });
}
