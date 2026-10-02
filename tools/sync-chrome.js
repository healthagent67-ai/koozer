#!/usr/bin/env node
/*
 * Copies the site header and footer from index.html into every other page, so
 * the menu and footer stay identical everywhere, and marks the current page in
 * the menu. Edit the header/footer in index.html, then run:
 *
 *   node tools/sync-chrome.js
 *
 * Pages need the marker comments <!-- HEADER:START --> ... <!-- HEADER:END -->
 * and <!-- FOOTER:START --> ... <!-- FOOTER:END -->.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SERVICE_PAGES = ['interior-painting.html', 'exterior-painting.html', 'commercial-painting.html', 'specialty-services.html'];

const grab = (html, name) => {
  const a = `<!-- ${name}:START -->`, b = `<!-- ${name}:END -->`;
  const i = html.indexOf(a), j = html.indexOf(b);
  if (i < 0 || j < 0) return null;
  return { start: i, end: j + b.length, text: html.slice(i, j + b.length) };
};

const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const header = grab(index, 'HEADER').text.replace(/ aria-current="page"/g, '').replace(/ is-current/g, '');
const footer = grab(index, 'FOOTER').text;

let count = 0;
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'))) {
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  let h = header;
  h = h.replace(`<a class="nav__link" href="${file}">`, `<a class="nav__link" href="${file}" aria-current="page">`);
  h = h.replace(`<li><a href="${file}">`, `<li><a href="${file}" aria-current="page">`);
  if (SERVICE_PAGES.includes(file)) h = h.replace('class="nav__link nav__link--btn"', 'class="nav__link nav__link--btn is-current"');

  const H = grab(html, 'HEADER');
  if (H) html = html.slice(0, H.start) + h + html.slice(H.end);
  const F = grab(html, 'FOOTER');
  if (F) html = html.slice(0, F.start) + footer + html.slice(F.end);
  if (H || F) { fs.writeFileSync(path.join(ROOT, file), html); count++; }
}
console.log(`Header/footer synced on ${count} pages`);
