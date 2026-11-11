// Usage : node build.js
// Source : src/page.fr.html (ton index.html actuel, renommé)
// Traductions : i18n/<code>.json  ->  { "texte français exact": "traduction" }
const fs = require('fs');
const BASE = 'https://www.get-wisp-app.com';
const LANGS = {
  fr: ['Français', 'fr'], en: ['English', 'en'], es: ['Español', 'es'],
  de: ['Deutsch', 'de'], it: ['Italiano', 'it'], pt: ['Português', 'pt'],
  ru: ['Русский', 'ru'], tr: ['Türkçe', 'tr'], ar: ['العربية', 'ar'],
  zh: ['中文（简体）', 'zh-Hans']
};

let src = fs.readFileSync('src/page.fr.html', 'utf8');
// guillemets doubles dans le JS pour que les apostrophes des traductions ne cassent rien
src = src.replace("'activé':'désactivé'", '"activé":"désactivé"');
// chemins absolus : les pages sont maintenant dans /fr/, /en/...
src = src.replace(/"wisp-site\//g, '"/wisp-site/');

const hreflangs = Object.entries(LANGS)
  .map(([c, [, h]]) => `<link rel="alternate" hreflang="${h}" href="${BASE}/${c}/">`)
  .join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${BASE}/en/">`;

const css = '.lang{background:var(--panel);color:var(--ink);border:1.5px solid var(--line);border-radius:99px;padding:8px 12px;font:inherit;font-size:.95rem}';
const done = [];

for (const code of Object.keys(LANGS)) {
  const [, h] = LANGS[code];
  let html = src;

  if (code !== 'fr') {
    const file = `i18n/${code}.json`;
    if (!fs.existsSync(file)) { console.warn('⏭  pas de', file); continue; }
    const dict = JSON.parse(fs.readFileSync(file, 'utf8'));
    // les clés les plus longues d'abord (ex. "désactivé" avant "activé")
    Object.keys(dict).sort((a, b) => b.length - a.length).forEach(k => {
      if (!html.includes(k)) console.warn(`⚠  [${code}] clé introuvable : ${k}`);
      html = html.split(k).join(dict[k]);
    });
  }

  const select = '<select class="lang" aria-label="Language" onchange="try{localStorage.setItem(\'lang\',this.value)}catch(e){};location.href=\'/\'+this.value+\'/\'">' +
    Object.entries(LANGS).map(([c, [n]]) => `<option value="${c}"${c === code ? ' selected' : ''}>${n}</option>`).join('') + '</select>';

  html = html
    .replace('<html lang="fr">', `<html lang="${h}"${code === 'ar' ? ' dir="rtl"' : ''}>`)
    .replace('</style>', css + '</style>')
    .replace(/<\/div>\s*<\/nav>/, select + '</div></nav>')
    .replace('</head>', `<link rel="canonical" href="${BASE}/${code}/">\n${hreflangs}\n</head>`);

  fs.mkdirSync(code, { recursive: true });
  fs.writeFileSync(`${code}/index.html`, html);
  done.push(code);
  console.log('✔', code);
}

fs.writeFileSync('sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  done.map(c => `<url><loc>${BASE}/${c}/</loc></url>`).join('\n') + '\n</urlset>\n');
