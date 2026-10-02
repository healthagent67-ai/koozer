# Koozer Painting

Static website for Koozer Painting (Charleston, SC). No build step is needed to
view it: open `index.html`, or serve the folder with any static file server.

## Pages

| Status | Pages |
| --- | --- |
| Built | Home, Interior Painting, Exterior Painting, Commercial Painting, Specialty Services, Projects, Contact Us, Free Estimate |
| Placeholder (blank, `noindex`) | About Us, Areas Served, Services (overview) |

The **Services** menu item is a dropdown label only. It has no page of its own,
so visitors choose one of the four service pages.

## SEO

Everything below is applied by `tools/seo.js` from `tools/seo-pages.json`:

- Unique `<title>` and meta description per page (Charleston, SC + the service)
- Canonical URLs, robots directives, Open Graph and Twitter cards
- JSON-LD structured data: `HousePainter` business (address, phone, founding date,
  service area, services), `Service`, `BreadcrumbList`, `WebSite`, `ContactPage`
- `sitemap.xml`, `robots.txt`, `site.webmanifest`, favicons
- Placeholder pages stay `noindex` and out of the sitemap until they have content

### Before launch

1. **Confirm the live domain.** `tools/seo-pages.json` assumes
   `https://www.koozerpainting.com`. If the domain differs, change `site.url`
   and run `npm run seo`.
2. **Redirects.** `_redirects` maps the old `.php` URLs to the new pages
   (Netlify / Cloudflare Pages format).
3. **Search Console.** Verify the domain, submit `sitemap.xml`, and claim or
   update the Google Business Profile so name, address and phone (NAP) match
   the site exactly.

### Adding a page later

1. Build the page (copy an existing one). Keep the `HEADER`/`FOOTER` markers.
2. Add an entry to `tools/seo-pages.json` (title, description, OG image, type).
   Change a placeholder from `"type": "noindex"` to `"page"` once it has content.
3. Add an OG image to `tools/og.js` and run `npm run og` (needs `npm install`).
4. Run `npm run build`. This syncs the header/footer to every page and
   regenerates the SEO tags and sitemap.

Menu or footer changes: edit them in `index.html`, then run `npm run sync`.

## Forms

The Contact and Free Estimate forms (`data-estimate-form`) have an empty
`data-endpoint`. Until one is set, submitting opens the visitor's email app
with the request pre-filled (to Kevin, cc Nick). To deliver submissions
directly, set `data-endpoint` on both forms to a form service URL
(Formspree, Netlify Forms, Web3Forms, etc.).
