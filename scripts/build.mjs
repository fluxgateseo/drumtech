// Builds the static site into dist/ from content/*.json + src/.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { locations, locationGroups, reviews, categoryOrder, fallbackImages, photoCredits } from '../src/data.mjs';
import { layout, header, setFooterData, home, article, listing, simplePage, notFound, esc } from '../src/templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const YEAR = new Date().getFullYear();

const readJSON = async (f) => JSON.parse(await readFile(path.join(ROOT, 'content', f), 'utf8'));

const site = await readJSON('site.json');
const rawPosts = await readJSON('posts.json');
const pages = await readJSON('pages.json');
const rawCategories = await readJSON('categories.json');

// WordPress titles use a Rank Math [currentyear] shortcode.
const withYear = (s) => (s ?? '').replace(/\[currentyear\]/g, String(YEAR));
const fmtShort = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtLong = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const decodeEntities = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
const plain = (html) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const slugify = (s) =>
  plain(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

// WordPress category names are mostly lower case; display them in sentence case.
const sentenceCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const categories = categoryOrder
  .map((slug) => rawCategories.find((c) => c.slug === slug))
  .filter(Boolean)
  .concat(rawCategories.filter((c) => !categoryOrder.includes(c.slug)))
  .map((c) => ({ ...c, name: sentenceCase(c.name) }));
const catById = new Map(categories.map((c) => [c.id, c]));

// Enrich posts with derived fields used by the templates.
const posts = rawPosts
  .map((p, i) => {
    const categoryList = p.categories.map((id) => catById.get(id)).filter(Boolean);
    // Prefer the most specific category for breadcrumbs.
    const primaryCategory =
      categoryList.find((c) => c.slug === 'drum-shops-in-uk') ??
      categoryList.find((c) => !['best-drum-shops', 'best-drummers'].includes(c.slug)) ??
      categoryList[0];

    // Number h2s and give them ids for the table of contents.
    const headings = [];
    const used = new Set();
    let n = 0;
    const htmlOut = p.html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
      let id = slugify(inner) || `section-${n + 1}`;
      while (used.has(id)) id += '-2';
      used.add(id);
      n += 1;
      const text = plain(inner);
      // Title-case shouty headings for the TOC only; the article keeps the original text.
      const tocText = text === text.toUpperCase() ? text.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : text;
      headings.push({ id, text: tocText });
      return `<h2 id="${id}" data-index="${String(n).padStart(2, '0')}">${inner}</h2>`;
    });

    const firstImage = p.html.match(/<img src="([^"]+)"/)?.[1];
    const words = plain(p.html).split(' ').length;
    return {
      ...p,
      title: withYear(p.title),
      seoTitle: withYear(p.seoTitle || p.title).replace(/\s*\|\s*Drum Tech$/, ''),
      seoDescription: withYear(p.seoDescription || p.excerpt),
      excerpt: withYear(p.excerpt),
      categoryList,
      categorySlugs: categoryList.map((c) => c.slug),
      primaryCategory,
      headings,
      htmlOut: withYear(htmlOut),
      cardImage: p.featuredImage || firstImage || (reviews[p.slug] ? '/assets/img/studio-kit.jpg' : fallbackImages[i % fallbackImages.length]),
      readingTime: Math.max(1, Math.round(words / 220)),
      dateShort: fmtShort(p.date),
      dateLong: fmtLong(p.date),
      modifiedLong: fmtLong(p.modified),
      location: locations[p.slug] ?? null,
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const bySlug = new Map(posts.map((p) => [p.slug, p]));

const directory = Object.entries(locations)
  .filter(([slug]) => bySlug.has(slug))
  .map(([slug, loc]) => ({ slug, ...loc, title: bySlug.get(slug).title }));

setFooterData({
  categories,
  cities: ['best-drum-shops-in-liverpool', 'drum-shops-in-manchester-united-kingdom', 'best-drum-shops-in-leed', 'drum-shops-in-edinburgh', 'best-drum-shops-in-cardiff', 'best-drum-shop-in-brighton']
    .map((slug) => ({ slug, city: locations[slug].city })),
  year: YEAR,
});

const organization = {
  '@type': 'Organization',
  '@id': `${site.url}/#organization`,
  name: site.name,
  url: `${site.url}/`,
  logo: `${site.url}/favicon.svg`,
};

async function writePage(urlPath, html) {
  const file = urlPath === '/404.html' ? path.join(DIST, '404.html') : path.join(DIST, urlPath, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});

async function build() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  // Static assets.
  await cp(path.join(ROOT, 'public'), DIST, { recursive: true });
  await mkdir(path.join(DIST, 'assets/css'), { recursive: true });
  await mkdir(path.join(DIST, 'assets/js'), { recursive: true });
  await mkdir(path.join(DIST, 'assets/vendor'), { recursive: true });
  await cp(path.join(ROOT, 'src/styles/main.css'), path.join(DIST, 'assets/css/main.css'));
  await cp(path.join(ROOT, 'src/js'), path.join(DIST, 'assets/js'), { recursive: true });
  await cp(path.join(ROOT, 'node_modules/three/build/three.module.min.js'), path.join(DIST, 'assets/vendor/three.module.min.js'));
  await cp(path.join(ROOT, 'node_modules/three/examples/jsm/environments/RoomEnvironment.js'), path.join(DIST, 'assets/vendor/RoomEnvironment.js'));

  // Home.
  const homePage = pages.find((p) => p.slug === 'home');
  const aboutHtml = homePage.html
    .replace(/<p>Drum\.tech\.co\.uk/, '<p>Drum-tech.co.uk')
    .replace(/find what you are looking<\/p>/, 'find what you are looking for.</p>');
  const groups = locationGroups.map((g) => ({
    ...g,
    count: g.id === 'all' ? directory.length : directory.filter((d) => d.group === g.id).length,
  }));
  const ukCount = directory.filter((d) => d.group === 'uk').length;
  const stats = [
    { label: 'Guides', value: posts.length },
    { label: 'UK locations', value: ukCount },
    { label: 'Categories', value: categories.length },
    { label: 'Since', value: new Date(posts.at(-1).date).getFullYear() },
  ];
  const reviewPosts = Object.keys(reviews)
    .map((slug) => bySlug.get(slug))
    .filter(Boolean)
    .map((p) => ({ ...p, spec: reviews[p.slug] }));

  await writePage(
    '/',
    layout({
      site,
      title: site.title,
      description: site.description,
      canonical: `${site.url}/`,
      image: '/assets/img/hero-stage.jpg',
      nav: header('home'),
      body: home({ site, posts, directory, latest: posts.slice(0, 6), reviews: reviewPosts, aboutHtml, stats, groups }),
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@graph': [
            organization,
            {
              '@type': 'WebSite',
              '@id': `${site.url}/#website`,
              url: `${site.url}/`,
              name: site.name,
              description: site.tagline,
              publisher: { '@id': `${site.url}/#organization` },
              inLanguage: 'en-GB',
            },
            {
              '@type': 'ItemList',
              name: 'Drum shop guides by location',
              itemListElement: directory.map((d, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: d.title,
                url: `${site.url}/${d.slug}/`,
              })),
            },
          ],
        },
      ],
      extraHead: `<script type="importmap">{"imports":{"three":"/assets/vendor/three.module.min.js"}}</script>\n<link rel="modulepreload" href="/assets/vendor/three.module.min.js">\n`,
      scripts: '<script type="module" src="/assets/js/drumkit.js"></script>',
    })
  );

  // Posts (oldest → newest drives prev/next).
  const chronological = [...posts].reverse();
  for (const post of posts) {
    const idx = chronological.indexOf(post);
    const related = posts
      .filter((p) => p !== post && p.categorySlugs.some((c) => c === post.primaryCategory?.slug))
      .slice(0, 3);
    const url = `${site.url}/${post.slug}/`;
    const crumbs = [{ name: 'Home', url: `${site.url}/` }];
    if (post.primaryCategory) crumbs.push({ name: post.primaryCategory.name, url: `${site.url}/category/${post.primaryCategory.slug}/` });
    crumbs.push({ name: post.title, url });

    await writePage(
      `/${post.slug}/`,
      layout({
        site,
        title: `${post.seoTitle} - Drum Tech`,
        description: post.seoDescription,
        canonical: url,
        type: 'article',
        image: post.cardImage.startsWith('/') ? post.cardImage : undefined,
        nav: header(post.primaryCategory?.slug),
        body: article({ post, related, prev: chronological[idx - 1], next: chronological[idx + 1] }),
        extraHead: `<meta property="article:published_time" content="${new Date(post.date).toISOString()}">\n<meta property="article:modified_time" content="${new Date(post.modified).toISOString()}">\n`,
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': reviews[post.slug] ? 'Review' : 'Article',
            headline: post.title,
            description: post.seoDescription,
            image: `${site.url}${post.cardImage}`,
            datePublished: new Date(post.date).toISOString(),
            dateModified: new Date(post.modified).toISOString(),
            author: { '@type': 'Person', name: post.author },
            publisher: organization,
            mainEntityOfPage: url,
            ...(reviews[post.slug]
              ? { itemReviewed: { '@type': 'Product', name: `${reviews[post.slug].brand} ${reviews[post.slug].model}`, brand: { '@type': 'Brand', name: reviews[post.slug].brand } } }
              : {}),
          },
          breadcrumbLd(crumbs),
        ],
      })
    );
  }

  // Category tabs shared by /blog/ and /category/*.
  const tabs = (active) =>
    [`<a class="tab" href="/blog/"${active === 'all' ? ' aria-current="page"' : ''}>All guides <span class="mono">${String(posts.length).padStart(2, '0')}</span></a>`]
      .concat(
        categories.map((c) => {
          const count = posts.filter((p) => p.categorySlugs.includes(c.slug)).length;
          return `<a class="tab" href="/category/${c.slug}/"${active === c.slug ? ' aria-current="page"' : ''}>${esc(c.name)} <span class="mono">${String(count).padStart(2, '0')}</span></a>`;
        })
      )
      .join('');

  // Blog index.
  const blogPage = pages.find((p) => p.slug === 'blog');
  await writePage(
    '/blog/',
    layout({
      site,
      title: `${blogPage?.seoTitle || 'Blog'} - Drum Tech`,
      description: blogPage?.seoDescription || site.description,
      canonical: `${site.url}/blog/`,
      nav: header('blog'),
      body: listing({
        eyebrow: 'Blog',
        title: 'All Drum Tech guides',
        lede: `${posts.length} guides to drum shops, drum lessons, kits and gear — across the UK and beyond.`,
        posts,
        tabs: tabs('all'),
        crumbs: [{ href: '/', label: 'Home' }, { label: 'Blog' }],
      }),
      jsonLd: [breadcrumbLd([{ name: 'Home', url: `${site.url}/` }, { name: 'Blog', url: `${site.url}/blog/` }])],
    })
  );

  // Category archives.
  for (const c of categories) {
    const inCat = posts.filter((p) => p.categorySlugs.includes(c.slug));
    const url = `${site.url}/category/${c.slug}/`;
    await writePage(
      `/category/${c.slug}/`,
      layout({
        site,
        title: `${c.seoTitle || c.name} - Drum Tech`,
        description: c.seoDescription || c.description || `${c.name} — guides from Drum Tech.`,
        canonical: url,
        nav: header(c.slug),
        body: listing({
          eyebrow: `Category · ${String(inCat.length).padStart(2, '0')} guides`,
          title: c.name,
          lede: c.description || null,
          posts: inCat,
          tabs: tabs(c.slug),
          crumbs: [{ href: '/', label: 'Home' }, { href: '/blog/', label: 'Blog' }, { label: c.name }],
        }),
        jsonLd: [
          breadcrumbLd([
            { name: 'Home', url: `${site.url}/` },
            { name: 'Blog', url: `${site.url}/blog/` },
            { name: c.name, url },
          ]),
        ],
      })
    );
  }

  // Privacy policy: drop headings the original left without any content.
  const privacy = pages.find((p) => p.slug === 'privacy-policy-cookies');
  if (privacy) {
    const blocks = privacy.html.match(/<(h[2-4]|p|ul|ol)[\s\S]*?<\/\1>/g) ?? [];
    const level = (b) => Number(b.match(/^<h([2-4])/)?.[1] ?? 9);
    const kept = blocks.filter((b, i) => {
      const lv = level(b);
      if (lv === 9) return true;
      // Keep a heading only if some content appears before the next heading of equal/higher rank.
      for (let j = i + 1; j < blocks.length; j++) {
        const lj = level(blocks[j]);
        if (lj === 9) return true;
        if (lj <= lv) return false;
      }
      return false;
    });
    const html = kept.join('\n').replace(/https:\/\/drum-tech\.co\.uk\/\./, '<a href="/">https://drum-tech.co.uk/</a>.');
    await writePage(
      '/privacy-policy-cookies/',
      layout({
        site,
        title: `${privacy.seoTitle || privacy.title} - Drum Tech`,
        description: privacy.seoDescription || 'Privacy policy and cookie information for drum-tech.co.uk.',
        canonical: `${site.url}/privacy-policy-cookies/`,
        nav: header(),
        body: simplePage({
          title: privacy.title,
          eyebrow: `Updated ${fmtLong(privacy.modified)}`,
          html,
          crumbs: [{ href: '/', label: 'Home' }, { label: privacy.title }],
        }),
      })
    );
  }

  // Image credits.
  const creditsHtml = `<p>Drum Tech uses free, openly licensed photography alongside images from our own guides. The 3D drum kit on the homepage is an original model built in code with <a href="https://threejs.org/" target="_blank" rel="noopener">three.js</a> (MIT licence). Typefaces: <a href="https://fonts.google.com/specimen/Archivo" target="_blank" rel="noopener">Archivo</a> and <a href="https://fonts.google.com/specimen/Space+Mono" target="_blank" rel="noopener">Space Mono</a> (SIL Open Font License).</p>
<h2 id="photography" data-index="01">Photography</h2>
<dl class="credits">${photoCredits
    .map(
      (c) => `<div><dt class="mono">${esc(c.use)}</dt><dd>${esc(c.title)} — <a href="${c.url}" target="_blank" rel="noopener">${esc(c.source)}</a>, ${esc(c.license)}</dd></div>`
    )
    .join('')}</dl>
<p>Shop photographs inside individual guides belong to the shops featured and are shown for identification.</p>`;
  await writePage(
    '/credits/',
    layout({
      site,
      title: 'Image credits - Drum Tech',
      description: 'Credits for the photography, 3D model and typefaces used on Drum Tech.',
      canonical: `${site.url}/credits/`,
      nav: header(),
      body: simplePage({ title: 'Image credits', eyebrow: 'Colophon', html: creditsHtml, crumbs: [{ href: '/', label: 'Home' }, { label: 'Image credits' }] }),
    })
  );

  // 404.
  await writePage(
    '/404.html',
    layout({
      site,
      title: 'Page not found - Drum Tech',
      description: site.description,
      canonical: `${site.url}/404.html`,
      nav: header(),
      body: notFound(),
    }).replace('index, follow', 'noindex, follow')
  );

  // Sitemap, robots, RSS.
  const urls = [
    { loc: '/', lastmod: posts[0].modified },
    { loc: '/blog/', lastmod: posts[0].modified },
    ...posts.map((p) => ({ loc: `/${p.slug}/`, lastmod: p.modified })),
    ...categories.map((c) => ({ loc: `/category/${c.slug}/`, lastmod: posts.find((p) => p.categorySlugs.includes(c.slug))?.modified })),
    { loc: '/privacy-policy-cookies/', lastmod: privacy?.modified },
    { loc: '/credits/' },
  ];
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${site.url}${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`)
      .join('\n')}\n</urlset>\n`
  );
  await writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  await writeFile(
    path.join(DIST, 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n<title>${esc(site.name)}</title>\n<link>${site.url}/</link>\n<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>\n<description>${esc(site.tagline)}</description>\n<language>en-gb</language>\n${posts
      .map(
        (p) =>
          `<item><title>${esc(p.title)}</title><link>${site.url}/${p.slug}/</link><guid>${site.url}/${p.slug}/</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`
      )
      .join('\n')}\n</channel>\n</rss>\n`
  );

  console.log(`Built ${posts.length} posts, ${categories.length} categories, ${urls.length} URLs → dist/`);
}

await build();
