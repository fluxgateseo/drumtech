// HTML templates. Every function returns a string; build.mjs writes them out.

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ARROW = '<span class="btn__arrow" aria-hidden="true">→</span>';

// Drum Tech mark: a drum head (ring) seen from above, with the signal-red
// beater square at its centre. Doubles as avatar and connector node.
export const markSvg = (label = '') => `<svg viewBox="0 0 32 32" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><rect width="32" height="32" rx="4" fill="#0b0405"/><circle cx="16" cy="16" r="9.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="5.5" fill="none" stroke="#382e30" stroke-width="1"/><rect x="13.5" y="13.5" width="5" height="5" fill="#e32735"/></svg>`;

const searchIcon = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="7" cy="7" r="5"/><path d="m11 11 3.5 3.5"/></svg>';

export function layout({ site, title, description, canonical, body, nav = '', jsonLd = [], image, type = 'website', extraHead = '', scripts = '' }) {
  const ogImage = image ? `${site.url}${image}` : `${site.url}/assets/img/og-default.jpg`;
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-video-preview:-1, max-image-preview:large">
<meta name="theme-color" content="#0b0405">
<meta property="og:locale" content="en_GB">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} feed" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500&family=Space+Mono&display=swap">
<link rel="stylesheet" href="/assets/css/main.css">
${extraHead}${jsonLd.map((d) => `<script type="application/ld+json">${JSON.stringify(d)}</script>`).join('\n')}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
${nav}
<main id="main">
${body}
</main>
${footer(site)}
<script src="/assets/js/main.js" defer></script>
${scripts}
</body>
</html>
`;
}

let footerData = null;
export function setFooterData(data) {
  footerData = data;
}

export function header(current) {
  const link = (href, label, key) =>
    `<a href="${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header class="site-header">
  <div class="container">
    <a class="brand" href="/" aria-label="Drum Tech home">${markSvg()}<span>Drum Tech</span></a>
    <nav class="nav" id="site-nav" aria-label="Main">
      ${link('/', 'Home', 'home')}
      ${link('/blog/', 'All guides', 'blog')}
      ${link('/category/drum-shops-in-uk/', 'Drum Shops in UK', 'drum-shops-in-uk')}
      ${link('/category/best-drummers/', 'Drummers &amp; Accessories', 'best-drummers')}
      ${link('/category/drum-set/', 'Gear reviews', 'drum-set')}
    </nav>
    <div class="header-actions">
      <a class="btn btn--primary" href="/#directory">Find a drum shop ${ARROW}</a>
      <button class="nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Open menu"><span></span></button>
    </div>
  </div>
</header>`;
}

function footer(site) {
  const { categories, cities, year } = footerData;
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/">${markSvg()}<span>Drum Tech</span></a>
        <p>${esc(site.tagline)}.</p>
      </div>
      <div class="footer-col">
        <h2>Categories</h2>
        <ul>${categories.map((c) => `<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul>
      </div>
      <div class="footer-col">
        <h2>Popular cities</h2>
        <ul>${cities.map((c) => `<li><a href="/${c.slug}/">${esc(c.city)}</a></li>`).join('')}</ul>
      </div>
      <div class="footer-col">
        <h2>Drum Tech</h2>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/#about">About</a></li>
          <li><a href="/privacy-policy-cookies/">Privacy Policy and Cookies</a></li>
          <li><a href="/credits/">Image credits</a></li>
          <li><a href="/feed.xml">RSS feed</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom mono">
      <span>© ${year} Drum Tech · drum-tech.co.uk</span>
      <a href="#main">Back to top ↑</a>
    </div>
  </div>
</footer>`;
}

export function postCard(post, { showCategory = true } = {}) {
  return `<a class="card" href="/${post.slug}/" data-cats="${post.categorySlugs.join(' ')}" data-title="${esc(post.title.toLowerCase())}">
  <div class="card__media">
    <img src="${esc(post.cardImage)}" alt="" loading="lazy" decoding="async" width="640" height="360">
    ${showCategory && post.primaryCategory ? `<span class="badge badge--sm">${esc(post.primaryCategory.name)}</span>` : ''}
  </div>
  <div class="card__body">
    <div class="card__meta mono"><time datetime="${post.date}">${post.dateShort}</time><span>${post.readingTime} min read</span></div>
    <h3 class="card__title">${esc(post.title)}</h3>
    <p class="card__excerpt">${esc(post.excerpt)}</p>
    <span class="card__more">Read guide ${ARROW}</span>
  </div>
</a>`;
}

export function home({ site, posts, directory, latest, reviews, aboutHtml, stats, groups }) {
  const rows = directory
    .map(
      (d) => `<a class="directory__row" href="/${d.slug}/" data-group="${d.group}">
        <span class="directory__code mono">${d.code}</span>
        <span class="directory__city">${esc(d.city)}</span>
        <span class="directory__region">${esc(d.region)}</span>
        <span class="directory__guide">${esc(d.title)}</span>
        <span class="directory__go" aria-hidden="true">→</span>
      </a>`
    )
    .join('\n');

  const groupTabs = groups
    .map(
      (g, i) =>
        `<button class="tab" type="button" role="tab" aria-selected="${i === 0}" data-filter="${g.id}">${esc(g.label)} <span class="mono">${String(g.count).padStart(2, '0')}</span></button>`
    )
    .join('');

  const reviewCards = reviews
    .map(
      (r) => `<a class="card feature" href="/${r.slug}/">
      <div class="mockup" aria-hidden="true">
        <div class="mockup__bar mono"><i class="mockup__dot mockup__dot--live"></i><i class="mockup__dot"></i><i class="mockup__dot"></i><span>${esc(r.spec.kind)}</span></div>
        <div class="mockup__img"><img src="${esc(r.cardImage)}" alt="" loading="lazy" decoding="async"></div>
        <div class="mockup__specs mono"><div>Brand<b>${esc(r.spec.brand)}</b></div><div>Model<b>${esc(r.spec.model)}</b></div></div>
      </div>
      <div class="card__body">
        <span class="mono" style="color:var(--color-slate)">Review · ${r.dateShort}</span>
        <h3 class="card__title" style="font-size:24px">${esc(r.title)}</h3>
        <p class="card__excerpt">${esc(r.excerpt)}</p>
        <span class="card__more">Read the review ${ARROW}</span>
      </div>
    </a>`
    )
    .join('\n');

  return `
<section class="hero" aria-labelledby="hero-title">
  <div class="hero__media"><img src="/assets/img/hero-stage.jpg" alt="" fetchpriority="high" width="2048" height="1365"></div>
  <div class="hero__stage" id="kit-stage" aria-hidden="true">
    <div class="hero__labels" id="kit-labels"></div>
  </div>
  <div class="container hero__content">
    <span class="badge eyebrow">UK drum shop directory</span>
    <h1 class="hero__title" id="hero-title">Find the best drum shops in the UK.</h1>
    <p class="hero__lede">${esc(site.tagline)}. A curated list of only the best drum shops — city by city.</p>
    <div class="hero__actions">
      <a class="btn btn--primary" href="#directory">Browse drum shops ${ARROW}</a>
      <a class="btn btn--ghost" href="/blog/">Read all guides</a>
    </div>
    <dl class="readouts">
      ${stats.map((s) => `<div class="readout"><dt class="readout__label mono">${s.label}</dt><dd style="margin:0" class="readout__value">${s.value}</dd></div>`).join('')}
    </dl>
  </div>
  <span class="hero__hint mono">Drag to rotate ↻</span>
</section>
<div class="hero-rule" aria-hidden="true"></div>

<section class="section" id="directory" aria-labelledby="directory-title">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="badge eyebrow"><span class="eyebrow__index">01</span> Directory</span>
        <h2 class="section-head__title" id="directory-title">Drum shops by city</h2>
        <p class="section-head__lede">Every Drum Tech location guide in one place — from Liverpool and Leeds to Cardiff, Edinburgh and beyond. Pick a location to see the shops we recommend.</p>
      </div>
      <a class="btn btn--ghost" href="/category/drum-shops-in-uk/">All UK guides ${ARROW}</a>
    </div>
    <div class="tabs" role="tablist" aria-label="Filter locations" data-filter-group="directory">${groupTabs}</div>
    <div class="directory" id="directory-list">
      <div class="directory__head mono" aria-hidden="true"><span>Code</span><span>Location</span><span>Region</span><span>Guide</span><span></span></div>
      ${rows}
    </div>
  </div>
</section>

<section class="section section--graphite" id="how" aria-labelledby="how-title">
  <div class="container process">
    <div>
      <span class="badge eyebrow"><span class="eyebrow__index">02</span> How it works</span>
      <h2 class="section-head__title" id="how-title">From first search to the right kit</h2>
      <div class="steps" role="tablist" aria-label="How Drum Tech works">
        <button class="step" type="button" role="tab" id="step-tab-1" aria-controls="step-1" aria-selected="true">Pick your city <span class="mono">01</span></button>
        <button class="step" type="button" role="tab" id="step-tab-2" aria-controls="step-2" aria-selected="false" tabindex="-1">Compare shops <span class="mono">02</span></button>
        <button class="step" type="button" role="tab" id="step-tab-3" aria-controls="step-3" aria-selected="false" tabindex="-1">Visit or buy online <span class="mono">03</span></button>
      </div>
      <div class="step-panel" id="step-1" role="tabpanel" aria-labelledby="step-tab-1">
        <h3>Start where you play</h3>
        <p>Choose your city or region from the directory. Each guide covers the drum shops, music stores and teachers worth knowing about locally — whether you need a full kit, cymbals, heads or a pair of sticks.</p>
        <a class="btn btn--ghost" href="#directory">Open the directory ${ARROW}</a>
      </div>
      <div class="step-panel" id="step-2" role="tabpanel" aria-labelledby="step-tab-2" hidden>
        <h3>See what each shop does best</h3>
        <p>Our guides look at experience, range and service: which stores stock DW, Gretsch, Mapex, Pearl, Zildjian, Paiste or Sabian, who sells electronic kits, and where the staff are drummers themselves.</p>
        <a class="btn btn--ghost" href="/drum-shops-in-united-kingdom/">Read the UK overview ${ARROW}</a>
      </div>
      <div class="step-panel" id="step-3" role="tabpanel" aria-labelledby="step-tab-3" hidden>
        <h3>Go in store — or order to your door</h3>
        <p>Visit the showroom to try before you buy, or use the online shops we recommend for delivery anywhere in the UK. Looking for a drum kit for sale? You are in the right spot, for sure.</p>
        <a class="btn btn--ghost" href="/best-online-drum-shops-2021/">Best online drum shops ${ARROW}</a>
      </div>
    </div>
    <figure class="chat" style="margin:0" aria-label="Example: finding a drum shop in Leeds">
      <div class="chat__photo"><img src="/assets/img/music-shop.jpg" alt="" loading="lazy" decoding="async"></div>
      <div class="chat__bar mono"><i></i><i></i><i></i><span>Shop finder</span></div>
      <div class="chat__body">
        <div class="bubble bubble--user">I'm in Leeds and need a new snare. Where should I go?</div>
        <div class="bubble bubble--bot">${markSvg()}<div>Our Leeds guide covers these drum stores:
          <ul><li>Leeds Drum Centre</li><li>PMT Leeds</li><li>Dawsons Music Leeds</li><li>Hobgoblin Leeds</li></ul>
          <a href="/best-drum-shops-in-leed/" style="display:inline-block;margin-top:8px">Open the Leeds guide →</a>
        </div></div>
      </div>
    </figure>
  </div>
</section>

<section class="section" id="latest" aria-labelledby="latest-title">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="badge eyebrow"><span class="eyebrow__index">03</span> Latest guides</span>
        <h2 class="section-head__title" id="latest-title">Fresh from the blog</h2>
      </div>
      <a class="btn btn--ghost" href="/blog/">View all ${posts.length} guides ${ARROW}</a>
    </div>
    <div class="grid-3">
      ${latest.map((p) => postCard(p)).join('\n')}
    </div>
  </div>
</section>

<section class="section section--graphite" id="reviews" aria-labelledby="reviews-title">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="badge eyebrow"><span class="eyebrow__index">04</span> Gear reviews</span>
        <h2 class="section-head__title" id="reviews-title">Kits and kit we've put to work</h2>
        <p class="section-head__lede">Hands-on reviews of drum sets, electronic kits and the amplification behind them.</p>
      </div>
    </div>
    <div class="grid-3">
      ${reviewCards}
    </div>
    <div class="connector" aria-hidden="true"><i></i><i></i><i></i></div>
  </div>
</section>

<section class="section" id="about" aria-labelledby="about-title">
  <div class="container about">
    <figure class="about__media" style="margin:0">
      <img src="/assets/img/percussion.jpg" alt="Percussion instruments with a tambourine in close-up" loading="lazy" decoding="async" width="1600" height="1067">
      <figcaption class="about__caption mono"><span>Drum Tech</span><span>Est. 2020</span></figcaption>
    </figure>
    <div>
      <span class="badge eyebrow"><span class="eyebrow__index">05</span> About Drum Tech</span>
      <h2 class="section-head__title" id="about-title" style="margin-bottom:var(--spacing-32)">Built by a drummer, for drummers</h2>
      <div class="about__text">${aboutHtml}</div>
      <div class="about__sign">${markSvg()}<div><strong style="font-weight:500">Malcom</strong><div class="mono" style="color:var(--color-slate)">Founder · Drum Tech</div></div></div>
    </div>
  </div>
</section>

<section class="section cta-band" aria-labelledby="cta-title">
  <div class="cta-band__media"><img src="/assets/img/concert-stage.jpg" alt="" loading="lazy" decoding="async"></div>
  <div class="container">
    <div>
      <h2 id="cta-title">Looking for a drum kit for sale?</h2>
      <p>You are in the right spot. Find the best drum shop near you.</p>
    </div>
    <a class="btn btn--primary" href="#directory">Find a drum shop ${ARROW}</a>
  </div>
</section>`;
}

export function article({ post, related, prev, next }) {
  const toc = post.headings.length
    ? `<aside class="toc" aria-label="On this page">
        <div class="toc__title mono">On this page</div>
        <ol>${post.headings
          .map((h, i) => `<li><a href="#${h.id}"><span class="mono">${String(i + 1).padStart(2, '0')}</span><span>${esc(h.text)}</span></a></li>`)
          .join('')}</ol>
        <a class="badge toc__back" href="/blog/">← All guides</a>
      </aside>`
    : `<aside class="toc" aria-label="Navigation"><a class="badge" href="/blog/">← All guides</a></aside>`;

  return `
<header class="page-head">
  <div class="container">
    <ol class="crumbs mono" aria-label="Breadcrumb">
      <li><a href="/">Home</a></li>
      ${post.primaryCategory ? `<li><a href="/category/${post.primaryCategory.slug}/">${esc(post.primaryCategory.name)}</a></li>` : ''}
      <li aria-current="page">${esc(post.location?.city ?? post.title)}</li>
    </ol>
    <div class="page-head__badges">${post.categoryList
      .map((c) => `<a class="badge badge--sm" href="/category/${c.slug}/">${esc(c.name)}</a>`)
      .join('')}</div>
    <h1>${esc(post.title)}</h1>
    <dl class="post-meta">
      <div><dt class="mono">Published</dt><dd><time datetime="${post.date}">${post.dateLong}</time></dd></div>
      <div><dt class="mono">Updated</dt><dd><time datetime="${post.modified}">${post.modifiedLong}</time></dd></div>
      <div><dt class="mono">Written by</dt><dd>${esc(post.author)}</dd></div>
      <div><dt class="mono">Reading time</dt><dd>${post.readingTime} min</dd></div>
    </dl>
  </div>
</header>
<div class="container article-layout">
  ${toc}
  <article>
    <div class="prose">
${post.htmlOut}
    </div>
    <div class="author-box">${markSvg()}<p><strong>Written by ${esc(post.author)}</strong>Drumming and playing drums is my passion — that's why I created Drum Tech.</p></div>
    <nav class="pager" aria-label="More guides">
      ${prev ? `<a href="/${prev.slug}/"><span class="mono">← Previous</span><span>${esc(prev.title)}</span></a>` : ''}
      ${next ? `<a href="/${next.slug}/"><span class="mono">Next →</span><span>${esc(next.title)}</span></a>` : ''}
    </nav>
  </article>
</div>
${
  related.length
    ? `<section class="section section--graphite" aria-labelledby="related-title">
  <div class="container">
    <div class="section-head">
      <div>
        <span class="badge eyebrow">Keep reading</span>
        <h2 class="section-head__title" id="related-title">Related guides</h2>
      </div>
      ${post.primaryCategory ? `<a class="btn btn--ghost" href="/category/${post.primaryCategory.slug}/">More in ${esc(post.primaryCategory.name)} ${ARROW}</a>` : ''}
    </div>
    <div class="grid-3">${related.map((p) => postCard(p)).join('\n')}</div>
  </div>
</section>`
    : ''
}`;
}

export function listing({ eyebrow, title, lede, posts, tabs, crumbs, searchable = true }) {
  return `
<header class="page-head">
  <div class="container">
    <ol class="crumbs mono" aria-label="Breadcrumb">${crumbs
      .map((c, i) => (i === crumbs.length - 1 ? `<li aria-current="page">${esc(c.label)}</li>` : `<li><a href="${c.href}">${esc(c.label)}</a></li>`))
      .join('')}</ol>
    <span class="badge eyebrow">${esc(eyebrow)}</span>
    <h1>${esc(title)}</h1>
    ${lede ? `<p class="page-head__lede">${esc(lede)}</p>` : ''}
  </div>
</header>
<section class="section" style="padding-top:var(--spacing-48)">
  <div class="container">
    <div class="toolbar">
      <nav class="tabs" aria-label="Categories">${tabs}</nav>
      ${
        searchable
          ? `<label class="search"><span class="visually-hidden">Search guides</span>${searchIcon}<input type="search" placeholder="Search guides, e.g. Leeds" data-search="cards" autocomplete="off"></label>`
          : ''
      }
    </div>
    <div class="grid-3" id="cards">${posts.map((p) => postCard(p)).join('\n')}</div>
    <p class="empty-state" id="cards-empty" hidden>No guides match that search. Try a city name such as “Cardiff” or “Edinburgh”.</p>
  </div>
</section>`;
}

export function simplePage({ title, eyebrow, html, crumbs }) {
  return `
<header class="page-head">
  <div class="container">
    <ol class="crumbs mono" aria-label="Breadcrumb">${crumbs
      .map((c, i) => (i === crumbs.length - 1 ? `<li aria-current="page">${esc(c.label)}</li>` : `<li><a href="${c.href}">${esc(c.label)}</a></li>`))
      .join('')}</ol>
    <span class="badge eyebrow">${esc(eyebrow)}</span>
    <h1>${esc(title)}</h1>
  </div>
</header>
<div class="container page-body">
  <div class="prose">
${html}
  </div>
</div>`;
}

export function notFound() {
  return `
<section class="section notfound">
  <div class="container">
    <p class="notfound__code mono">Error 404 · Signal lost</p>
    <h1>That page isn't on the kit.</h1>
    <p>The link may be old or mistyped. Try the directory or browse every guide.</p>
    <div class="hero__actions">
      <a class="btn btn--primary" href="/#directory">Find a drum shop ${ARROW}</a>
      <a class="btn btn--ghost" href="/blog/">All guides</a>
    </div>
  </div>
</section>`;
}
