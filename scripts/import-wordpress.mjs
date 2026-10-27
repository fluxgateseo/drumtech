// Imports every post, page and category from the live WordPress site
// (drum-tech.co.uk) into content/*.json and downloads the uploaded images
// into public/assets/uploads. Re-run with `npm run import` to refresh.
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://drum-tech.co.uk';
const API = `${ORIGIN}/wp-json/wp/v2`;
const UA = { 'User-Agent': 'Mozilla/5.0 (DrumTech static rebuild importer)' };
const UPLOADS_DIR = path.join(ROOT, 'public/assets/uploads');
const CONTENT_DIR = path.join(ROOT, 'content');

async function getJSON(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// Reads the Rank Math <title> and meta description from a rendered page.
async function seoMeta(url) {
  try {
    const html = await getText(url);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    return {
      title: title ? decode(title).replace(/\s*-\s*Drum Tech$/, '').trim() : null,
      description: description ? decode(description).trim() : null,
    };
  } catch {
    return { title: null, description: null };
  }
}

const images = new Map(); // remote url -> local public path

function localUpload(src) {
  const clean = src.replace(/^https?:\/\/drum-tech\.co\.uk/, '');
  const rel = decodeURIComponent(clean.replace(/^\/wp-content\/uploads\//, ''));
  // Normalise curly quotes and spaces in filenames so URLs stay simple.
  const safe = rel.replace(/[‘’']/g, '').replace(/\s+/g, '-');
  const publicPath = `/assets/uploads/${safe}`;
  images.set(src.startsWith('http') ? src : ORIGIN + src, publicPath);
  return publicPath;
}

// Turns WordPress/Elementor markup into clean semantic HTML.
function cleanContent(html) {
  let out = html;
  // Browser-extension debris and builder shortcodes.
  out = out.replace(/<div id="gtx-trans"[\s\S]*?<\/div>\s*<\/div>/g, '');
  out = out.replace(/\[elementor-template[^\]]*\]/g, '');
  // Unwrap presentational spans.
  out = out.replace(/<span style="font-weight: ?400;?">([\s\S]*?)<\/span>/g, '$1');
  out = out.replace(/<span[^>]*>|<\/span>/g, '');
  // One <h1> per page: demote in-content h1s.
  out = out.replace(/<h1([^>]*)>/g, '<h2$1>').replace(/<\/h1>/g, '</h2>');
  // Headings carry their own weight; drop <b>/<strong> wrappers inside them.
  out = out.replace(/<(h[2-4])([^>]*)>([\s\S]*?)<\/\1>/g, (_, tag, attrs, inner) => {
    const text = inner.replace(/<\/?(b|strong)>/g, '').replace(/^\s*•\s*/, '').trim();
    return `<${tag}>${text}</${tag}>`;
  });
  // <b> -> <strong>.
  out = out.replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>');
  // Figures: keep the image and caption, drop WP classes and inline widths.
  out = out.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/g, (_, inner) => {
    const img = inner.match(/<img[^>]*>/)?.[0] ?? '';
    const caption = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1]?.trim();
    return `<figure>${img}${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
  });
  out = out.replace(/<img[^>]*>/g, (tag) => {
    const src = tag.match(/src="([^"]+)"/)?.[1];
    const alt = tag.match(/alt="([^"]*)"/)?.[1] ?? '';
    const w = tag.match(/width="(\d+)"/)?.[1];
    const h = tag.match(/height="(\d+)"/)?.[1];
    if (!src) return '';
    const local = /drum-tech\.co\.uk\/wp-content\/uploads\//.test(src) ? localUpload(src) : src;
    return `<img src="${local}" alt="${alt}"${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''} loading="lazy" decoding="async">`;
  });
  // Responsive, privacy-friendly YouTube embeds.
  out = out.replace(/<iframe[^>]*src="https:\/\/www\.youtube\.com\/embed\/([\w-]+)[^"]*"[^>]*title="([^"]*)"[^>]*><\/iframe>|<iframe[^>]*title="([^"]*)"[^>]*src="https:\/\/www\.youtube\.com\/embed\/([\w-]+)[^"]*"[^>]*><\/iframe>/g,
    (_, id1, t1, t2, id2) => {
      const id = id1 || id2;
      const title = t1 || t2 || 'Video';
      return `<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${title}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    });
  // Internal links become root-relative.
  out = out.replace(/href="https?:\/\/drum-tech\.co\.uk(\/[^"]*)"/g, 'href="$1"');
  // External links open in a new tab and stay nofollow where the original was.
  out = out.replace(/<a ([^>]*href="https?:\/\/[^"]+"[^>]*)>/g, (m, attrs) => {
    let a = attrs.replace(/\s*target="[^"]*"/, '').replace(/\s*rel="[^"]*"/, '');
    const rel = /nofollow/.test(attrs) ? 'nofollow noopener' : 'noopener';
    return `<a ${a} target="_blank" rel="${rel}">`;
  });
  // Tidy empty paragraphs and whitespace.
  out = out.replace(/<p>\s*(&nbsp;)?\s*<\/p>/g, '');
  out = out.replace(/\n{2,}/g, '\n').trim();
  return out;
}

async function download(url, publicPath) {
  const dest = path.join(ROOT, 'public', publicPath);
  try {
    await access(dest);
    return;
  } catch {}
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(encodeURI(decodeURI(url)).replace(/^http:/, 'https:'), { headers: UA });
  if (!res.ok) {
    console.warn(`  ! image ${res.status} ${url}`);
    return;
  }
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  await mkdir(CONTENT_DIR, { recursive: true });

  const categories = (await getJSON(`${API}/categories?per_page=100`)).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: decode(c.name),
    description: stripTags(c.description || ''),
    count: c.count,
  }));
  for (const c of categories) {
    const meta = await seoMeta(`${ORIGIN}/category/${c.slug}/`);
    c.seoTitle = meta.title;
    c.seoDescription = meta.description;
  }

  const rawPosts = await getJSON(`${API}/posts?per_page=100&_embed=1`);
  const posts = [];
  for (const p of rawPosts) {
    const meta = await seoMeta(p.link);
    const featured = p._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    posts.push({
      id: p.id,
      slug: p.slug,
      title: decode(p.title.rendered),
      date: p.date,
      modified: p.modified,
      author: 'Malcom',
      categories: p.categories,
      excerpt: stripTags(p.excerpt.rendered).replace(/\s*\[&hellip;\]|\s*\[…\]/, '…'),
      seoTitle: meta.title,
      seoDescription: meta.description,
      featuredImage: featured ? localUpload(featured) : null,
      html: cleanContent(p.content.rendered),
    });
    console.log(`post  ${p.slug}`);
  }

  const rawPages = await getJSON(`${API}/pages?per_page=100`);
  const pages = [];
  for (const p of rawPages) {
    const meta = await seoMeta(p.link);
    pages.push({
      id: p.id,
      slug: p.slug,
      title: decode(p.title.rendered),
      modified: p.modified,
      seoTitle: meta.title,
      seoDescription: meta.description,
      html: cleanContent(p.content.rendered),
    });
    console.log(`page  ${p.slug}`);
  }

  // Site-level identity from the homepage.
  const home = await getText(`${ORIGIN}/`);
  const site = {
    name: 'Drum Tech',
    url: ORIGIN,
    tagline: decode(home.match(/class="site-description">([^<]*)</)?.[1] ?? '').trim(),
    title: decode(home.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').trim(),
    description: decode(home.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '').trim(),
  };

  for (const [remote, local] of images) await download(remote, local);

  await writeFile(path.join(CONTENT_DIR, 'site.json'), JSON.stringify(site, null, 2) + '\n');
  await writeFile(path.join(CONTENT_DIR, 'categories.json'), JSON.stringify(categories, null, 2) + '\n');
  await writeFile(path.join(CONTENT_DIR, 'posts.json'), JSON.stringify(posts, null, 2) + '\n');
  await writeFile(path.join(CONTENT_DIR, 'pages.json'), JSON.stringify(pages, null, 2) + '\n');
  console.log(`\n${posts.length} posts, ${pages.length} pages, ${categories.length} categories, ${images.size} images`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
