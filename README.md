# Teacha

Static bilingual website. Serve this directory with Herd (`http://teacha.test`)
or any static HTTP server. No build or package installation is required.

- `index.html`: complete Czech content, products, prices, destinations, and widget configuration.
- `assets/site.css`: responsive layout and styling.
- `assets/site.js`: English translations, language preference, category filters,
  mobile navigation, and optional Instagram widget loader.
- Product imagery uses CSS windows over the existing menu boards; the originals
  remain available through the full-menu disclosure.

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
   empty `data-widget-id` attribute on `#instagram-feed` in `index.html`.
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
