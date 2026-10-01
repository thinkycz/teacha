import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => readFile(path.join(root, name), 'utf8');
const business = JSON.parse(await read('site/business.json'));
const messages = JSON.parse(await read('site/messages.json'));
const template = await read('site/home.html');
const locationTemplate = await read('site/location.html');
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const home = (lang) => lang === 'en' ? '/en/' : '/';
const absolute = (url) => business.origin + url;
const t = (key, lang) => {
  if (!messages[key]?.[lang]) throw new Error(`Missing ${lang} translation: ${key}`);
  return escape(messages[key][lang]);
};
const fill = (html, values) => html.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Missing template value: ${key}`);
  return values[key];
});
function translate(html, lang) {
  return html
    .replace(/<([a-z][\w-]*)([^>]*\bdata-i18n="([^"]+)"[^>]*)>[\s\S]*?<\/\1\s*>/g,
      (_, tag, attrs, key) => `<${tag}${attrs}>${t(key, lang)}</${tag}>`)
    .replace(/<([a-z][\w-]*)([^>]*\bdata-i18n-label="([^"]+)"[^>]*)>/g,
      (_, tag, attrs, key) => `<${tag}${attrs.replace(/aria-label="[^"]*"/, `aria-label="${t(key, lang)}"`)}>`);
}
function address(branch, lang) {
  const a = branch.address;
  return `<address>${branch.floor ? escape(branch.floor[lang]) + '<br />' : ''}${escape(a.streetAddress)}<br />${escape(a.postalCode)} ${escape(lang === 'en' ? a.addressLocality.replace('Praha', 'Prague') : a.addressLocality)}</address>`;
}
function mapUrl(branch) {
  const a = branch.address;
  return 'https://www.google.com/maps/search/?api=1&amp;query=' + encodeURIComponent(`${branch.name} ${a.streetAddress} ${a.postalCode} ${a.addressLocality}`);
}
function branchCards(lang) {
  return business.branches.map((b) => `<article class="branch" id="${b.id}">
    <div class="branch-top"><p class="eyebrow">${escape(b.district[lang])}</p></div>
    <h3><a href="${b.paths[lang]}">${escape(b.label)}</a></h3>
    ${address(b, lang)}
    <a class="text-link" href="${mapUrl(b)}" target="_blank" rel="noopener noreferrer">${t('directions', lang)}</a><br />
    <a class="branch-details-link" href="${b.paths[lang]}">${t('branch.details', lang)} · ${escape(b.label)}</a>
  </article>`).join('\n');
}
function legal(lang) {
  const a = business.registeredOffice;
  return `<div><p class="eyebrow">${t('operator', lang)}</p><strong>${escape(business.legalName)}</strong>
    <address>${escape(a.streetAddress)}<br />${escape(a.postalCode)} ${escape(a.addressLocality)}</address></div>
    <div><p>${t('companyId', lang)} ${business.companyId}</p><p>${t('register', lang)}</p></div>`;
}
function languages(lang, paths) {
  return `<nav class="languages" aria-label="${t('language', lang)}">${['cs', 'en'].map((l) =>
    `<a href="${paths[l]}" data-lang="${l}" lang="${l}" hreflang="${l}"${l === lang ? ' aria-current="page"' : ''}>${l === 'cs' ? 'CZ' : 'EN'}</a>`).join('')}</nav>`;
}
function graph(lang, url, branch) {
  const organization = {
    '@type': 'Organization', '@id': absolute('/#organization'), name: business.name,
    legalName: business.legalName, url: absolute('/'),
    logo: absolute('/assets/logo/teacha-logo.svg'), email: business.email, telephone: business.phone,
    identifier: business.companyId, address: { '@type': 'PostalAddress', ...business.registeredOffice },
    sameAs: business.social,
  };
  const locations = (branch ? [branch] : business.branches).map((b) => ({
    '@type': 'CafeOrCoffeeShop', '@id': absolute(b.paths.cs + '#business'), name: b.name,
    url: absolute(b.paths[lang]), address: { '@type': 'PostalAddress', ...b.address },
    parentOrganization: { '@id': organization['@id'] }, hasMap: mapUrl(b).replace('&amp;', '&'),
    hasMenu: absolute(home(lang) + '#menu'), servesCuisine: ['Matcha', 'Bubble tea', 'Fruit tea'],
  }));
  return { '@context': 'https://schema.org', '@graph': [organization, ...locations, {
    '@type': 'WebPage', '@id': absolute(url + '#webpage'), url: absolute(url), inLanguage: lang,
    about: branch ? { '@id': locations[0]['@id'] } : { '@id': organization['@id'] },
  }] };
}
function head(lang, paths, title, description, branch) {
  const url = absolute(paths[lang]);
  return `    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}" />
    <meta name="theme-color" content="#fff9ef" />
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hreflang="cs" href="${absolute(paths.cs)}" />
    <link rel="alternate" hreflang="en" href="${absolute(paths.en)}" />
    <link rel="alternate" hreflang="x-default" href="${absolute(paths.cs)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Teacha" />
    <meta property="og:locale" content="${lang === 'cs' ? 'cs_CZ' : 'en_GB'}" />
    <meta property="og:locale:alternate" content="${lang === 'cs' ? 'en_GB' : 'cs_CZ'}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escape(title)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:image" content="${absolute('/assets/social/teacha-preview.jpg')}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Teacha · Matcha &amp; Bubble Tea · Prague" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escape(title)}" />
    <meta name="twitter:description" content="${escape(description)}" />
    <meta name="twitter:image" content="${absolute('/assets/social/teacha-preview.jpg')}" />
    <meta name="twitter:image:alt" content="Teacha · Matcha &amp; Bubble Tea · Prague" />
    <link rel="icon" href="/assets/logo/teacha-icon.svg" type="image/svg+xml" />
    <link rel="preload" href="/assets/fonts/nunito-variable.ttf" as="font" type="font/ttf" crossorigin />
    <link rel="stylesheet" href="/assets/site.css" />
    <script id="ui-messages" type="application/json">${JSON.stringify(Object.fromEntries(['menuClose', 'menuToggle', 'results', 'feed.loading', 'feed.failed'].map((key) => [key, messages[key]]))).replace(/</g, '\\u003c')}</script>
    <script src="/assets/site.js" defer></script>
    <script type="application/ld+json">${JSON.stringify(graph(lang, paths[lang], branch)).replace(/</g, '\\u003c')}</script>`;
}
const sharedValues = (lang) => ({
  HOME: home(lang), EMAIL: business.email, PHONE_RAW: business.phone, PHONE_DISPLAY: business.phoneDisplay,
  HOME_HEADING_CONTEXT: lang === 'cs' ? 'Matcha a bubble tea v Praze' : 'Matcha and bubble tea in Prague',
  HERO_EYEBROW: lang === 'cs' ? 'MATCHA & BUBBLE TEA · PRAHA' : 'MATCHA & BUBBLE TEA · PRAGUE',
  BRANCH_CARDS: branchCards(lang), LEGAL: legal(lang),
  CAREER_SUBJECT: encodeURIComponent(lang === 'cs' ? 'Brigáda v Teacha' : 'Part-time job at Teacha'),
});
const outputs = [];
async function save(url, html) {
  const name = url === '/' ? 'index.html' : url.slice(1) + 'index.html';
  await mkdir(path.dirname(path.join(root, name)), { recursive: true });
  await writeFile(path.join(root, name), '<!-- Generated by scripts/build-site.mjs; edit site/ sources. -->\n' + html.replace(/[ \t]+$/gm, ''));
  outputs.push(name);
}
for (const lang of ['cs', 'en']) {
  const paths = { cs: '/', en: '/en/' };
  const title = lang === 'cs' ? 'Matcha a bubble tea v Praze | Teacha' : 'Matcha & Bubble Tea in Prague | Teacha';
  const description = lang === 'cs'
    ? 'Matcha latte, ovocné čaje a bubble tea v Praze. Teacha na Žižkově a v OC Arkády Pankrác. Prohlédni si menu a objednej rozvoz ze Žižkova.'
    : 'Matcha latte, fruit tea and bubble tea in Prague. Visit Teacha in Žižkov or OC Arkády Pankrác. Explore our menu and order delivery from Žižkov.';
  const html = fill(translate(template, lang), { ...sharedValues(lang), HEAD: head(lang, paths, title, description), LANGUAGES: languages(lang, paths) })
    .replace('<html lang="cs">', `<html lang="${lang}">`);
  await save(paths[lang], html);
  for (const branch of business.branches) {
    const other = business.branches.find((b) => b.id !== branch.id);
    const branchTitle = lang === 'cs' ? `Matcha a bubble tea ${branch.label} | Teacha Praha` : `Matcha & Bubble Tea in ${branch.label} | Teacha Prague`;
    const branchDescription = lang === 'cs'
      ? `${branch.name}: matcha latte, ovocné čaje a bubble tea. ${branch.address.streetAddress}, ${branch.address.addressLocality}. Menu, kontakt a cesta na pobočku.`
      : `${branch.name}: matcha latte, fruit tea and bubble tea. ${branch.address.streetAddress}, ${branch.address.addressLocality.replace('Praha', 'Prague')}. Menu, contact and directions.`;
    const deliverySection = html.match(/<section\s+id="delivery"[\s\S]*?<\/section>/)[0];
    const content = fill(locationTemplate, {
      ...sharedValues(lang), DISTRICT: escape(branch.district[lang]),
      BACK_TO_LOCATIONS: lang === 'cs' ? '← Všechny pobočky' : '← All locations',
      LOCATION_HEADING: lang === 'cs' ? `Matcha a bubble tea: Teacha ${branch.label}` : `Matcha & bubble tea at Teacha ${branch.label}`,
      LOCATION_DESCRIPTION: escape(branch.description[lang]), VIEW_MENU: t('viewMenu', lang),
      LOCATION_INFORMATION: lang === 'cs' ? 'Informace o pobočce' : 'Location information',
      FIND_US: lang === 'cs' ? 'Kde nás najdeš' : 'Find us', ADDRESS: address(branch, lang), MAP_URL: mapUrl(branch), DIRECTIONS: t('directions', lang),
      DRINK_HEADING: lang === 'cs' ? 'Tvoje malá čajová pauza' : 'Your little tea break',
      DRINK_COPY: lang === 'cs' ? 'Prohlédni si naše matcha latte, ovocné a mléčné čaje i krémový kokos. Nápoj si můžeš doladit přísadami nebo jiným mlékem podle nabídky v menu.' : 'Explore our matcha lattes, fruit and milk teas, and creamy coconut drinks. Customise your drink with toppings or a different milk from the options in our menu.',
      OTHER_BRANCH_COPY: lang === 'cs' ? 'Hodí se ti druhá pobočka?' : 'Prefer our other location?',
      OTHER_BRANCH_PATH: other.paths[lang], OTHER_BRANCH_NAME: escape(other.label),
      DELIVERY: branch.delivery ? deliverySection : '',
    });
    let branchHtml = template.replace(/<main id="main">[\s\S]*?<\/main>/, content);
    if (!branch.delivery) branchHtml = branchHtml.replace('data-i18n="nav.delivery"', 'data-i18n="nav.menu"');
    branchHtml = translate(branchHtml, lang);
    // Global navigation points back to the matching homepage, except local delivery on Žižkov.
    branchHtml = branchHtml.replace(/href="#(menu|visit|career|delivery)"/g, (_, section) =>
      `href="${section === 'delivery' && branch.delivery ? '#delivery' : home(lang) + '#' + (section === 'delivery' && !branch.delivery ? 'menu' : section)}"`);
    branchHtml = fill(branchHtml, { ...sharedValues(lang), HEAD: head(lang, branch.paths, branchTitle, branchDescription, branch), LANGUAGES: languages(lang, branch.paths) })
      .replace('<html lang="cs">', `<html lang="${lang}">`);
    await save(branch.paths[lang], branchHtml);
  }
}
await writeFile(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${outputs.map((name) => `  <url><loc>${absolute('/' + name.replace(/index\.html$/, ''))}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /tmp/\nDisallow: /output/\nDisallow: /site/\nDisallow: /scripts/\n\nSitemap: ${absolute('/sitemap.xml')}\n`);
// An explicit allowlist prevents private working material from reaching hosting.
if (process.argv.includes('--dist')) {
  const destination = path.join(root, 'dist');
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  for (const name of [...outputs, 'robots.txt', 'sitemap.xml']) {
    await mkdir(path.dirname(path.join(destination, name)), { recursive: true });
    await cp(path.join(root, name), path.join(destination, name));
  }
  await cp(path.join(root, 'assets'), path.join(destination, 'assets'), {
    recursive: true, filter: (source) => !source.endsWith('.DS_Store'),
  });
}
console.log(`Generated ${outputs.length} static pages, robots.txt and sitemap.xml${process.argv.includes('--dist') ? '; deployment files in dist/' : ''}.`);
