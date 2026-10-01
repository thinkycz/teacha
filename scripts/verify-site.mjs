import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const origin = 'https://teacha.cz';
const pages = ['/', '/en/', '/pobocky/zizkov/', '/pobocky/arkady-pankrac/', '/en/locations/zizkov/', '/en/locations/arkady-pankrac/'];
const pairs = [['/', '/en/'], ['/pobocky/zizkov/', '/en/locations/zizkov/'], ['/pobocky/arkady-pankrac/', '/en/locations/arkady-pankrac/']];
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'g'))].map((m) => attributes(m[0]));
const sources = new Map();
for (const url of pages) sources.set(url, await readFile(path.join(root, url.slice(1), 'index.html'), 'utf8'));
const titles = new Set();
const descriptions = new Set();
let linksChecked = 0;
for (const [url, html] of sources) {
  const english = url.startsWith('/en/');
  assert.match(html, new RegExp(`<html lang="${english ? 'en' : 'cs'}">`));
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/, `${url}: unresolved template token`);
  assert.equal(tags(html, 'h1').length, 1, `${url}: one H1`);
  assert.equal(tags(html, 'main').length, 1);
  assert.equal(tags(html, 'header').length, 1);
  assert.equal(tags(html, 'footer').length, 1);
  assert.ok(tags(html, 'nav').some((n) => n.id === 'mobile-nav'));
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(!titles.has(title), `${url}: unique title`); titles.add(title);
  const meta = tags(html, 'meta');
  const description = meta.find((m) => m.name === 'description').content;
  assert.ok(!descriptions.has(description), `${url}: unique description`); descriptions.add(description);
  const links = tags(html, 'link');
  assert.deepEqual(links.filter((l) => l.rel === 'canonical').map((l) => l.href), [origin + url]);
  const pair = pairs.find((p) => p.includes(url));
  for (const [lang, alternative] of [['cs', pair[0]], ['en', pair[1]], ['x-default', pair[0]]]) {
    assert.equal(links.find((l) => l.hreflang === lang)?.href, origin + alternative);
  }
  assert.equal(meta.find((m) => m.property === 'og:url').content, origin + url);
  assert.equal(meta.find((m) => m.property === 'og:title').content, title);
  assert.equal(meta.find((m) => m.name === 'twitter:card').content, 'summary_large_image');
  assert.equal(meta.find((m) => m.property === 'og:image').content, origin + '/assets/social/teacha-preview.jpg');
  const current = tags(html, 'a').filter((a) => a['data-lang'] && a['aria-current'] === 'page');
  assert.equal(current.length, 1);
  assert.equal(current[0].href, url);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const organization = graph.find((e) => e['@type'] === 'Organization');
  assert.equal(organization.address.streetAddress, 'Příčná 1892/4, Nové Město');
  const businesses = graph.filter((e) => e['@type'] === 'CafeOrCoffeeShop');
  assert.equal(businesses.length, pair[0] === '/' ? 2 : 1);
  for (const business of businesses) {
    assert.notEqual(business.address.streetAddress, organization.address.streetAddress);
    assert.ok(html.includes(business.address.streetAddress), 'Business address must be visible');
    assert.equal(business.address.addressCountry, 'CZ');
    assert.ok(!business.openingHoursSpecification && !business.aggregateRating && !business.geo && !business.telephone);
  }
  if (pair[0] === '/') {
    assert.equal(tags(html, 'article').filter((a) => a.class === 'product').length, 36, 'Complete menu in source HTML');
    assert.equal(tags(html, 'section').filter((s) => s['data-category']).length, 6);
    assert.ok(html.includes(english ? 'Classic Matcha Latte' : 'Klasické matcha latte'));
    assert.ok(html.includes(english ? 'Join us behind the tea bar!' : 'Pojď za náš čajový bar!'));
    assert.equal(tags(html, 'img').filter((i) => i.src.endsWith('.webp') && !i.loading).length, 3, 'Only hero crops load eagerly');
  }
  const deliveries = tags(html, 'a').filter((a) => /wolt\.com|food\.bolt\.eu|foodora\.cz/.test(a.href));
  assert.equal(deliveries.length, url.includes('arkady-pankrac') ? 0 : 3);
  // Check local links and fragment targets in the deployment bundle, not developer files.
  for (const entry of [...tags(html, 'a'), ...tags(html, 'img'), ...tags(html, 'script'), ...links]) {
    const reference = entry.src || entry.href;
    if (!reference || (!reference.startsWith('/') && !reference.startsWith('#'))) continue;
    const target = new URL(reference, origin + url);
    const filename = target.pathname.endsWith('/') ? target.pathname + 'index.html' : target.pathname;
    await stat(path.join(root, filename.slice(1)));
    if (target.hash && filename.endsWith('.html')) {
      const targetHtml = await readFile(path.join(root, filename.slice(1)), 'utf8');
      assert.ok(targetHtml.includes(`id="${target.hash.slice(1)}"`), `${url}: broken fragment ${reference}`);
    }
    linksChecked++;
  }
  console.log(`PASS ${url}: localized HTML, metadata, schema and links`);
}
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort(), pages.map((p) => origin + p).sort());
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert.ok(robots.includes('Allow: /') && robots.includes('Disallow: /tmp/') && robots.includes('Disallow: /output/'));
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert.deepEqual((await readdir(root)).sort(), ['assets', 'en', 'index.html', 'pobocky', 'robots.txt', 'sitemap.xml'].sort());
console.log(`PASS sitemap, robots and deployment allowlist; ${linksChecked} local links/assets checked.`);

// Optional actual HTTP response checks. Fetch does not execute JavaScript.
if (process.argv[2]) {
  for (const url of [...pages, '/robots.txt', '/sitemap.xml', '/assets/social/teacha-preview.jpg']) {
    const response = await fetch(new URL(url, process.argv[2]));
    assert.equal(response.status, 200, url);
    if (sources.has(url)) assert.equal(await response.text(), sources.get(url));
  }
  console.log('PASS all six pages and discovery/preview files over HTTP without JavaScript.');
}
