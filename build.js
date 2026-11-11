// Usage : node build.js
// Source : src/page.fr.html
// Traductions : i18n/<code>.json  ->  { "texte français exact": "traduction" }
const fs = require('fs');
const BASE = 'https://www.get-wisp-app.com';
const LANGS = {
  fr: 'fr', en: 'en', es: 'es', de: 'de', it: 'it',
  pt: 'pt', ru: 'ru', tr: 'tr', ar: 'ar', zh: 'zh-Hans'
};

let src = fs.readFileSync('src/page.fr.html', 'utf8');
src = src.replace("'activé':'désactivé'", '"activé":"désactivé"');
src = src.replace(/"wisp-site\//g, '"/wisp-site/');

const done = [];

for (const code of Object.keys(LANGS)) {
  let html = src;

  if (code !== 'fr') {
    const file = `i18n/${code}.json`;
    if (!fs.existsSync(file)) { console.warn('⏭  pas de', file); continue; }
    const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
    Object.keys(dict).sort((a, b) => b.length - a.length).forEach(k => {
      if (!html.includes(k)) console.warn(`⚠  [${code}] clé introuvable : ${k}`);
      html = html.split(k).join(dict[k]);
    });
  }
  done.push(code);
  fs.mkdirSync(code, { recursive: true });
  fs.writeFileSync(`${code}/index.html`, html);
}

const hreflangs = done
  .map(c => `<link rel="alternate" hreflang="${LANGS[c]}" href="${BASE}/${c}/">`)
  .join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${BASE}/en/">`;

for (const code of done) {
  const p = `${code}/index.html`;
  let html = fs.readFileSync(p, 'utf8')
    .replace('<html lang="fr">', `<html lang="${LANGS[code]}"${code === 'ar' ? ' dir="rtl"' : ''}>`)
    .replace('</head>', `<link rel="canonical" href="${BASE}/${code}/">\n${hreflangs}\n</head>`);
  fs.writeFileSync(p, html);
  console.log('✔', code);
}

fs.writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  done.map(c => `<url><loc>${BASE}/${c}/</loc></url>`).join('\n') + '\n</urlset>\n');
