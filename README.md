# Life Ready Learning Hub

Free financial education site (articles, videos, templates) for the Life Ready
community, built by Leigh Grant Financial. Static HTML, deployed
on Cloudflare Workers at https://life-ready-dashboard.lucas-gil.workers.dev
(auto-deploys from `main`). `.assetsignore` keeps build sources private and
`_redirects` holds permanent redirects.

## Editing content

1. Edit page content directly in the `.html` files (article bodies, FAQs, copy).
2. Add or change articles, videos, templates, titles, and descriptions in the
   catalogue at the top of `build.py`.
3. Run `python3 build.py`. It fills the `<!-- NAME:START/END -->` markers in each
   page (SEO tags, JSON-LD, header/footer from `partials/`, breadcrumbs, cards)
   and regenerates `sitemap.xml`, `robots.txt`, and `llms.txt`.
4. Commit the built files.

### Publishing a video

Set `youtube_id`, `upload_date`, and `duration` on the entry in `VIDEOS` in
`build.py`, then rebuild. The video gets a click-to-play embed on the Videos
page, its topic's library section, and matching articles, plus VideoObject
schema.

### Changing the domain

Update `SITE_URL` in `build.py` and rebuild.

Preview locally with `npx serve .` (supports clean URLs like `/education`).
