const sharp = require('sharp');
const fs = require('fs');
const R = require('path').join(__dirname, '..') + '/';
const OUT = R + 'assets/img/og/';
fs.mkdirSync(OUT, { recursive: true });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// [output name, source image, focus x% (0-100), headline lines, subline]
const CARDS = [
  ['home', 'assets/img/hero.jpg', 70, ['Trusted Charleston', 'painting contractors', 'since 1996'], 'Interior · Exterior · Commercial · Historic restoration'],
  ['interior', 'assets/img/interior/hero-sunroom.jpg', 60, ['Interior Painting', 'in Charleston, SC'], 'Free estimates · 843-881-2212'],
  ['exterior', 'assets/img/exterior/hero-storefront.jpg', 55, ['Exterior Painting', 'in Charleston, SC'], 'Free estimates · 843-881-2212'],
  ['commercial', 'assets/img/commercial/hero-taproom.jpg', 60, ['Commercial Painting', 'in Charleston, SC'], 'Free estimates · 843-881-2212'],
  ['specialty', 'assets/img/specialty/hero-cabinets.jpg', 60, ['Specialty Painting', 'Services in Charleston, SC'], 'Staining · Cabinetry · Epoxy · Striping and more'],
  ['projects', 'assets/img/projects/historic-pink-church-full.jpg', 50, ['Recent Painting Projects', 'in Charleston, SC'], 'Koozer Painting since 1996'],
  ['contact', 'assets/img/hero.jpg', 70, ['Contact Koozer Painting', 'Charleston, SC'], 'Call 843-881-2212'],
  ['estimate', 'assets/img/hero.jpg', 70, ['Free Painting Estimate', 'in Charleston, SC'], 'Call 843-881-2212 or request online'],
];

(async () => {
  for (const [name, src, fx, lines, sub] of CARDS) {
    const meta = await sharp(R + src).metadata();
    // cover-crop to 1200x630 keeping the focal x position
    const scale = Math.max(1200 / meta.width, 630 / meta.height);
    const w = Math.round(meta.width * scale), h = Math.round(meta.height * scale);
    const left = Math.max(0, Math.min(w - 1200, Math.round((w - 1200) * fx / 100)));
    const base = await sharp(R + src).resize(w, h).extract({ left, top: Math.round((h - 630) / 2), width: 1200, height: 630 }).toBuffer();
    const tspans = lines.map((l, i) => `<tspan x="70" dy="${i === 0 ? 0 : 66}">${esc(l)}</tspan>`).join('');
    const top = 250 - (lines.length - 2) * 30;
    const svg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#12231f" stop-opacity=".94"/><stop offset=".55" stop-color="#12231f" stop-opacity=".78"/><stop offset="1" stop-color="#12231f" stop-opacity=".12"/>
  </linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="70" y="${top - 70}" width="64" height="5" fill="#c7a052"/>
  <text x="70" y="${top}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="58" fill="#ffffff">${tspans}</text>
  <text x="70" y="${top + lines.length * 66 + 20}" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#a8cdd3">${esc(sub)}</text>
  <text x="70" y="560" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="24" letter-spacing="4" fill="#c7a052">KOOZER PAINTING</text>
</svg>`);
    await sharp(base).composite([{ input: svg }]).jpeg({ quality: 82, mozjpeg: true }).toFile(OUT + 'og-' + name + '.jpg');
  }

  // icons from the favicon SVG
  const svgIcon = fs.readFileSync(R + 'assets/img/favicon.svg');
  const png = (size) => sharp(svgIcon, { density: 384 }).resize(size, size).png().toBuffer();
  fs.writeFileSync(R + 'assets/img/apple-touch-icon.png', await png(180));
  fs.writeFileSync(R + 'assets/img/icon-192.png', await png(192));
  fs.writeFileSync(R + 'assets/img/icon-512.png', await png(512));
  const p32 = await png(32);
  fs.writeFileSync(R + 'assets/img/favicon-32.png', p32);
  // favicon.ico at the site root (browsers request it by default): ICO container around a PNG
  const hdr = Buffer.alloc(22);
  hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4);
  hdr.writeUInt8(32, 6); hdr.writeUInt8(32, 7); hdr.writeUInt8(0, 8); hdr.writeUInt8(0, 9);
  hdr.writeUInt16LE(1, 10); hdr.writeUInt16LE(32, 12); hdr.writeUInt32LE(p32.length, 14); hdr.writeUInt32LE(22, 18);
  fs.writeFileSync(R + 'favicon.ico', Buffer.concat([hdr, p32]));
  console.log('og cards + icons written');
})();
