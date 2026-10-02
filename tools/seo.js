#!/usr/bin/env node
/*
 * Applies SEO metadata to every page listed in tools/seo-pages.json:
 *   title, meta description, robots, canonical, Open Graph / Twitter cards,
 *   icons, and JSON-LD structured data (business, services, breadcrumbs).
 * Also writes sitemap.xml, robots.txt and site.webmanifest.
 *
 * Usage:  node tools/seo.js
 * It is safe to run repeatedly. To add a page, add an entry to seo-pages.json.
 * Pages marked "noindex" stay out of search results and the sitemap until
 * their type is changed to "page" (or another indexable type).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo-pages.json'), 'utf8'));
const SITE = cfg.site;
const BASE = SITE.url.replace(/\/$/, '');
const B = SITE.business;
const abs = (p) => BASE + (p.startsWith('/') ? p : '/' + p);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const BIZ_ID = BASE + '/#business';
const SITE_ID = BASE + '/#website';
const OG_W = 1200, OG_H = 630;

const areaServed = B.areaServed.map((a) => (typeof a === 'string' ? { '@type': 'City', name: a } : { '@type': a.type || 'City', name: a.name }));

function businessNode() {
  return {
    '@type': 'HousePainter',
    '@id': BIZ_ID,
    name: SITE.name,
    legalName: B.legalName,
    url: BASE + '/',
    description: B.description,
    logo: { '@type': 'ImageObject', url: abs(B.logo), width: B.logoWidth, height: B.logoHeight },
    image: [abs('assets/img/og/og-home.jpg')],
    telephone: B.telephone,
    email: B.email,
    address: { '@type': 'PostalAddress', ...B.address },
    hasMap: B.mapUrl,
    areaServed,
    foundingDate: B.founded,
    founder: { '@type': 'Person', name: B.founder },
    sameAs: B.sameAs,
    contactPoint: [{ '@type': 'ContactPoint', telephone: B.telephone, contactType: 'customer service', areaServed: 'US-SC', availableLanguage: 'English' }],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Painting services',
      itemListElement: B.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: abs(s.path), description: s.description, areaServed, provider: { '@id': BIZ_ID } },
      })),
    },
  };
}

function graphFor(p) {
  const url = abs(p.path);
  const og = abs('assets/img/og/' + p.og);
  const graph = [businessNode()];
  const pageType = { home: 'WebPage', service: 'WebPage', collection: 'CollectionPage', contact: 'ContactPage', about: 'AboutPage', page: 'WebPage' }[p.type] || 'WebPage';

  if (p.type === 'home') {
    graph.push({ '@type': 'WebSite', '@id': SITE_ID, url: BASE + '/', name: SITE.name, inLanguage: 'en-US', publisher: { '@id': BIZ_ID } });
  }

  const page = {
    '@type': pageType, '@id': url + '#webpage', url, name: p.title, description: p.description, inLanguage: 'en-US',
    isPartOf: { '@id': SITE_ID }, about: { '@id': BIZ_ID },
    primaryImageOfPage: { '@type': 'ImageObject', url: og, width: OG_W, height: OG_H },
  };

  if (p.type !== 'home') {
    const crumbs = [{ name: 'Home', url: BASE + '/' }];
    if (p.type === 'service') crumbs.push({ name: 'Painting Services', url: BASE + '/#services' });
    crumbs.push({ name: p.breadcrumb, url });
    graph.push({
      '@type': 'BreadcrumbList', '@id': url + '#breadcrumb',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
    });
    page.breadcrumb = { '@id': url + '#breadcrumb' };
  }

  if (p.type === 'service') {
    const s = p.service;
    const node = {
      '@type': 'Service', '@id': url + '#service', name: s.name, serviceType: s.serviceType, description: s.description, url,
      image: og, areaServed, provider: { '@id': BIZ_ID },
    };
    if (s.offers) {
      node.hasOfferCatalog = {
        '@type': 'OfferCatalog', name: s.name,
        itemListElement: s.offers.map((o) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: o, areaServed, provider: { '@id': BIZ_ID } } })),
      };
    }
    graph.push(node);
    page.mainEntity = { '@id': url + '#service' };
  }

  if (p.type === 'about') {
    graph.push({ '@type': 'Person', '@id': BASE + '/#kevin-koozer', name: B.founder, jobTitle: 'Founder', worksFor: { '@id': BIZ_ID }, telephone: '+1-843-568-4021', email: 'kevin@koozerpainting.com' });
    graph.push({ '@type': 'Person', '@id': BASE + '/#nick-koozer', name: 'Nick Koozer', worksFor: { '@id': BIZ_ID }, telephone: '+1-843-864-7146', email: 'nick@koozerpainting.com' });
    page.mainEntity = { '@id': BIZ_ID };
  }

  graph.push(page);
  return { '@context': 'https://schema.org', '@graph': graph };
}

function headBlock(p) {
  const indexable = p.type !== 'noindex';
  const L = [];
  L.push(`<title>${esc(p.title)}</title>`);
  if (!indexable) {
    L.push('<meta name="robots" content="noindex, follow">');
  } else {
    const url = abs(p.path);
    const og = abs('assets/img/og/' + p.og);
    L.push(`<meta name="description" content="${esc(p.description)}">`);
    L.push('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">');
    L.push(`<link rel="canonical" href="${url}">`);
    L.push('<meta name="geo.region" content="US-SC">');
    L.push('<meta name="geo.placename" content="Charleston">');
    L.push(`<meta property="og:type" content="website">`);
    L.push(`<meta property="og:site_name" content="${esc(SITE.name)}">`);
    L.push(`<meta property="og:locale" content="${SITE.locale}">`);
    L.push(`<meta property="og:title" content="${esc(p.title)}">`);
    L.push(`<meta property="og:description" content="${esc(p.description)}">`);
    L.push(`<meta property="og:url" content="${url}">`);
    L.push(`<meta property="og:image" content="${og}">`);
    L.push(`<meta property="og:image:width" content="${OG_W}">`);
    L.push(`<meta property="og:image:height" content="${OG_H}">`);
    L.push(`<meta property="og:image:alt" content="${esc(p.ogAlt)}">`);
    L.push('<meta name="twitter:card" content="summary_large_image">');
    L.push(`<meta name="twitter:title" content="${esc(p.title)}">`);
    L.push(`<meta name="twitter:description" content="${esc(p.description)}">`);
    L.push(`<meta name="twitter:image" content="${og}">`);
    L.push(`<meta name="twitter:image:alt" content="${esc(p.ogAlt)}">`);
  }
  L.push(`<meta name="theme-color" content="${SITE.themeColor}">`);
  L.push('<link rel="icon" href="favicon.ico" sizes="32x32">');
  L.push('<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">');
  L.push('<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">');
  L.push('<link rel="manifest" href="site.webmanifest">');
  if (indexable) L.push(`<script type="application/ld+json">${JSON.stringify(graphFor(p))}</script>`);
  return '  <!-- SEO:START -->\n' + L.map((l) => '  ' + l).join('\n') + '\n  <!-- SEO:END -->';
}

const problems = [];
const today = new Date().toISOString().slice(0, 10);
const sitemap = [];

for (const p of cfg.pages) {
  const file = path.join(ROOT, p.file);
  if (!fs.existsSync(file)) { problems.push(`${p.file}: file not found`); continue; }
  let html = fs.readFileSync(file, 'utf8');
  const had = html.length;

  html = html
    .replace(/[ \t]*<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->\n?/g, '')
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\n?/g, '')
    .replace(/[ \t]*<meta name="description"[^>]*>\n?/g, '')
    .replace(/[ \t]*<meta name="robots"[^>]*>\n?/g, '')
    .replace(/[ \t]*<meta name="theme-color"[^>]*>\n?/g, '')
    .replace(/[ \t]*<link rel="(?:icon|apple-touch-icon|manifest|canonical)"[^>]*>\n?/g, '')
    .replace(/[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '');

  const viewport = html.match(/[ \t]*<meta name="viewport"[^>]*>\n?/);
  if (!viewport) { problems.push(`${p.file}: no viewport meta to anchor to`); continue; }
  html = html.replace(viewport[0], viewport[0].replace(/\n?$/, '\n') + headBlock(p) + '\n');
  fs.writeFileSync(file, html);

  // checks
  if (p.type !== 'noindex') {
    if (p.title.length > 65) problems.push(`${p.file}: title is ${p.title.length} chars (aim for 65 or fewer)`);
    if (p.description.length < 110 || p.description.length > 160) problems.push(`${p.file}: description is ${p.description.length} chars (aim for 110-160)`);
    if (!fs.existsSync(path.join(ROOT, 'assets/img/og', p.og))) problems.push(`${p.file}: missing OG image assets/img/og/${p.og}`);
    sitemap.push(p);
  }
}

// uniqueness
const seen = {};
for (const p of cfg.pages.filter((x) => x.type !== 'noindex')) {
  for (const k of ['title', 'description']) {
    if (seen[k + p[k]]) problems.push(`${p.file}: duplicate ${k} (also on ${seen[k + p[k]]})`);
    seen[k + p[k]] = p.file;
  }
}

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  sitemap.map((p) => `  <url>\n    <loc>${abs(p.path)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n') + '\n</urlset>\n');

fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);

fs.writeFileSync(path.join(ROOT, 'site.webmanifest'), JSON.stringify({
  name: SITE.name, short_name: SITE.name, start_url: '/', display: 'browser',
  background_color: '#fbfaf7', theme_color: SITE.themeColor,
  icons: [
    { src: 'assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2) + '\n');

console.log(`SEO applied to ${cfg.pages.length} pages; ${sitemap.length} in sitemap.xml`);
if (problems.length) { console.log('\nCheck these:'); problems.forEach((x) => console.log(' - ' + x)); process.exitCode = 1; }
else console.log('All titles, descriptions and images look good.');
