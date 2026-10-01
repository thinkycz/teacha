# Teacha

Static bilingual website. Serve this directory with Herd (`http://teacha.test`)
or any static HTTP server. The generated pages are committed; hosting needs no
Node runtime, build or package installation.

- `site/home.html`: shared homepage, products, prices, destinations and widget configuration.
- `site/messages.json`: Czech/English copy, including product names and dynamic UI labels.
- `site/business.json`: company and branch facts shared by visible content and structured data.
- `site/location.html`: shared location-page layout.
- `scripts/build-site.mjs`: dependency-free Node generator for all six pages and discovery files.
- `index.html`, `en/`, `pobocky/`: generated HTML; edit the sources above instead.
- `assets/site.css`: responsive layout and styling.
- `assets/site.js`: section-preserving language links, category filters,
  mobile navigation, and optional Instagram widget loader.
- Product imagery uses CSS windows over WebP versions of the menu boards; the originals
  remain available through the full-menu disclosure.

## Generate and deploy

Run these commands from this directory after changing content, translations or business facts:

```sh
node scripts/build-site.mjs --dist
node scripts/verify-site.mjs
node --check assets/site.js
```

Deploy **only the contents of `dist/`**, preserving its subdirectories. The
allowlist contains the six pages, assets, `robots.txt` and `sitemap.xml`; it
excludes `tmp/`, `output/`, generator sources and development scripts. The
generator replaces only the disposable `dist/` directory when creating a bundle.
Without `--dist`, it updates just the committed generated pages and discovery files.

The Czech homepage is `/`; English is `/en/`. Each branch has Czech and English
pages under `/pobocky/` and `/en/locations/`. URLs determine language; there are
no preference-based redirects. Language links preserve the current fragment
when JavaScript is available and remain usable links without it.

For a plain static preview that also checks discovery-file status codes:

```sh
python3 -m http.server 8767 --bind 127.0.0.1 --directory dist
# In another terminal:
node scripts/verify-site.mjs http://127.0.0.1:8767
```

Herd can return a 404 status for `/robots.txt` even when serving the correct file
contents. Do not treat that as a missing generated file. Verify the deployed
host returns **200** for both discovery files, all six pages and the preview image.

After a separately requested deployment, verify HTTP and `www` redirects to
`https://teacha.cz`, directory URLs, canonicals, language alternatives and assets.
Keep the HTTPS non-www hostname as canonical. Submit
`https://teacha.cz/sitemap.xml` through the Teacha Search Console property if
access is available, then inspect both languages and branch URLs. Compare local
search impressions, clicks and indexing after Google has recrawled the site.

## Image assets

The WebP menu images retain the originals' 3840 × 2160 dimensions, preserving
existing percentage crop geometry. The shared preview is a 1200 × 630 JPEG
composed from the existing wordmark and drink imagery. Both are committed.
To regenerate them, use `scripts/build-images.mjs` with Sharp available in your
development environment (`node scripts/build-images.mjs`). Alternatively set
`TEACHA_SHARP_MODULE` to the absolute path of an existing Sharp module entrypoint.
Sharp is optional for asset regeneration and is not needed by the page generator
or hosting. Keep the original font/menu files and their licenses.

## Connect the live Instagram feed

The Instagram profile points to `@teacha.matcha`; TikTok points to `@teacha.cz`.
The live feed is **not connected** until a real Elfsight widget ID is configured.
With no ID, the page shows a direct Instagram link and makes no Elfsight request.

1. Create an Instagram Feed widget in a Teacha-owned account at
   <https://elfsight.com/instagram-feed-instashow/>.
2. Select `@teacha.matcha` as the only source. Configure the six latest posts in
   a grid, three desktop columns and two mobile columns, with autoplay disabled
   and posts linking to Instagram. Use the site's green and cream colors.
3. Complete any account connection requested by Elfsight in its own interface.
   Do not put access tokens or account credentials in this repository.
4. Copy the UUID from the generated `elfsight-app-UUID` embed class into the
   empty `data-widget-id` attribute on `#instagram-feed` in `site/home.html`, then regenerate the pages.
   Do not add another provider script: `assets/site.js` loads it once when the
   section approaches the viewport.
5. Verify real Teacha posts, mobile columns, post destinations, and provider
   refresh behavior. This verification is required before calling the feed live.

The loader keeps the profile buttons available and falls back after a script
error or 15-second timeout. It recognizes rendered Elfsight post elements or an
iframe inside its mount. Recheck that readiness signal when integrating the
actual widget or changing provider versions.

Elfsight currently documents a 48-hour refresh interval. Its free plan has
branding and a 200-view monthly limit; exceeding the limit can deactivate the
widget. No subscription has been purchased. Check current plan terms before
production use:
<https://elfsight.com/instagram-feed-instashow/pricing/>.

## Verification

Check Czech and English, all six categories and All, both branch links, the
Žižkov-only delivery notice and three delivery partners, hiring email, social
links, mobile menu keyboard behavior, and menu disclosures. Verify 360, 390,
768, and 1440px widths. With JavaScript disabled, all drinks and ordinary links
remain readable and usable. JavaScript syntax check: `node --check assets/site.js`.

See `docs/seo-verification.md` for the SEO validation results and release checks.
