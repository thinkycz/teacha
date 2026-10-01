# Teacha SEO verification — 1 October 2026

Local implementation and validation completed before repository delivery.
Production deployment and Search Console submission require separate verification.

## Acceptance checks

- Generated all six Czech/English pages from shared templates, copy and business facts.
- All six pages, `robots.txt`, `sitemap.xml` and the social preview return 200 from
  the plain static deployment preview. HTTP checks fetch complete HTML without running JavaScript.
- `node scripts/verify-site.mjs http://127.0.0.1:8767` passed: 260 local links/assets,
  fragment targets, one H1 per page, unique titles/descriptions, canonicals,
  reciprocal language alternatives, sitemap entries, business facts, and deployment allowlist.
- Both homepage source files contain all 36 drinks across six categories. All
  prices, original JPG downloads and the Žižkov delivery URLs are retained.
- Browser checks passed for all six pages at 360, 390, 768 and 1440px: correct
  language and headings, no horizontal overflow, and no JavaScript errors.
- All seven filter options passed in both languages with counts 5, 5, 5, 12, 6,
  3 and 36. Original-menu disclosure and original download URLs also passed.
- Mobile navigation opened and closed with Escape. Switching from `/en/#visit`
  to Czech retained `/#visit`. Branch language links point to the matching branch.
- Pankrác pages contain no delivery-provider links. Their ordering/navigation
  links lead to the menu; Žižkov pages include the three delivery providers.
- JavaScript syntax and `git diff --check` passed.

## Google structured-data validation

Submitted the generated Czech homepage HTML through the **code** tab of Google's
Rich Results Test. Google reported **six valid detected items and no critical
errors**. The test covers the Organization and both branch entities.

[Google validation result](https://search.google.com/test/rich-results/result?id=EBWxGeJjIhx6rjyH1CMwHg)

Optional warnings remain for branch `image`, `priceRange` and `telephone`, plus
an organization image warning. These values were not supplied because the
published site does not establish branch-specific photographs, ranges or phone
numbers. Hours, coordinates and ratings were also omitted. The general contact
number belongs to the Organization; the registered office is not a store.

This was a code validation, so production image fetching and the new branch URLs
must still be checked after deployment. The temporary Google result may expire.

## Mobile Lighthouse comparison

Lighthouse 13.5.0, default mobile simulated throttling, headless Chrome, local
plain Python static servers. The baseline used the previous committed site;
the final run used the deployment bundle. These are local lab measurements.

| Metric | Before | After |
| --- | ---: | ---: |
| Performance | 58 | 78 |
| Accessibility | 96 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| Largest Contentful Paint | 17.6 s | 6.0 s |
| Cumulative Layout Shift | 0.330 | 0 |
| Total transferred bytes | 3,177,499 | 1,035,099 |

The two menu WebPs total roughly 380 KB, versus roughly 2.4 MB for the originals.
The files retain the original 3840 × 2160 geometry. The original JPGs remain
downloadable. A small delivery-label contrast adjustment resolved the existing
accessibility finding.

Raw local reports are in ignored `output/seo/lighthouse-before.json` and
`output/seo/lighthouse-after.json`. The SEO score was already 100: Lighthouse's
basic checks do not replace language indexing, local structured data or sitemap
validation. Remaining performance opportunities include font transfer, image
delivery and hosting cache settings; no production configuration was changed.

## Release checks still required

1. Regenerate with `node scripts/build-site.mjs --dist` and deploy only `dist/` contents.
2. Confirm HTTPS/non-www redirects and 200 responses for all six directory URLs,
   sitemap, robots and preview image. Check that host-specific rules do not override robots.
3. Recheck canonicals, language alternatives and structured data against deployed HTML.
4. Submit the sitemap in the Teacha Search Console property if access is available;
   inspect the new language and branch URLs and monitor indexing/impressions/clicks.

Local Herd serves the new robots body with a **404 status**. The plain static
server correctly returns 200. This environment behavior is documented in the
README; it was not fixed by altering the user's Herd configuration.
