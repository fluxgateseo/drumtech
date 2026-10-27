# Drum Tech — drum-tech.co.uk

A static rebuild of [drum-tech.co.uk](https://drum-tech.co.uk/), the guide to the best drum shops in the UK, drums and drumming accessories. It carries over all 30 guides, the home, blog and privacy pages and the 6 categories from the WordPress site, and keeps every URL the same.

The design follows the *Andercore* style reference ("steel blueprint at midnight"): near-black canvases, 1px steel hairlines, 4px corners, Archivo and Space Mono, and one rationed signal red.

## Quick start

```bash
npm install
npm run build   # writes the site to dist/
npm run serve   # preview at http://localhost:4173
```

`dist/` is plain static HTML and can be deployed to any static host (Netlify, Cloudflare Pages, GitHub Pages, S3 and others). The `404.html` page sits at the root of `dist/`.

## How it is organised

| Path | What it holds |
| --- | --- |
| `content/*.json` | Posts, pages, categories and site metadata imported from WordPress, already cleaned up. |
| `public/assets/uploads/` | The original site's images, optimised. |
| `public/assets/img/` | Free CC0 photography (see `/credits/`). |
| `src/templates.mjs` | HTML templates for the layout, home, article, listing and simple pages. |
| `src/data.mjs` | Editorial metadata: location codes for the directory, gear review specs, photo credits. |
| `src/styles/main.css` | The design system and all component styles. |
| `src/js/main.js` | Progressive enhancements: mobile nav, directory filter, steps, search, TOC highlight. |
| `src/js/drumkit.js` | The homepage 3D drum kit, an original procedural model built with three.js. |
| `scripts/import-wordpress.mjs` | Re-imports content and images from the live WordPress REST API. |
| `scripts/build.mjs` | Generates every page, `sitemap.xml`, `robots.txt` and `feed.xml`. |

## Refreshing content

`npm run import` pulls the latest posts, pages, categories, Rank Math titles and descriptions, and images from the live WordPress site into `content/` and `public/assets/uploads/`. Images that already exist are skipped, so newly downloaded ones arrive unoptimised. To shrink them, run:

```bash
find public/assets/uploads -iname '*.jpg' -exec convert {} -resize '1400x1400>' -strip -interlace Plane -quality 80 {} \;
```

To add a new location to the homepage directory, add its post slug to `locations` in `src/data.mjs`.

## SEO notes

- URLs match the WordPress site (`/<post-slug>/`, `/category/<slug>/`, `/blog/`, `/privacy-policy-cookies/`).
- Titles and meta descriptions come from Rank Math. The `[currentyear]` shortcode is replaced with the build year.
- Each page has a canonical URL, Open Graph and Twitter tags, and JSON-LD: WebSite and Organization on the home page, Article or Review on posts, and BreadcrumbList.
- The WordPress feed was at `/feed/`. This build publishes `/feed.xml`, so set up a redirect from `/feed/` on your host.
