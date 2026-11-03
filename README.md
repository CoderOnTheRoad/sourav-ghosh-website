# Sourav Ghosh — personal website

A GitHub Pages academic website with local drafts, personal pages, optional figures and an owner publishing service.

## One CV maker

Use the original CV maker at https://coderontheroad.github.io/academic-cv-studio/ for CV editing, arrangement, styling, publication imports and PDF/Word downloads.

1. Update your CV there and click **Backup** to download its JSON.
2. Open this website’s `admin.html` and choose **Import CV JSON**.
3. Review the website draft and publish when ready.

Import replaces the website draft's CV details, sections and publications. Blog posts, quotes, memories, archived links, custom pages and homepage settings are retained. Publication figures and featured selections are matched by DOI, entry ID or title. Figures for removed papers are dropped. Website visibility preferences are matched by section ID or title. CV import does not publish automatically or write back to the original CV maker.

The former `cv/index.html` address redirects to the original CV maker. There is no second CV editor in this repository.

## Website editing

- Public entry: `index.html`
- Website editor: `admin.html`
- Published data: `shared-profile.json`
- Owner publishing setup: [SETUP.md](SETUP.md)

The editor saves local drafts in IndexedDB. `?preview=1` displays the local draft; ordinary visitors read published content only. Local drafts do not synchronise between devices. Download a full website backup to preserve all website content and figures; use Restore backup for that file. Use Import CV JSON for a CV-only backup.

Website form edits affect the website only. The editor interface is publicly downloadable; publishing requires the configured owner’s GitHub authorization. Publishing remains disabled until the OAuth service is configured. User text is escaped, links accept HTTP(S), and uploaded raster images are resized before storage. Images are included in the published JSON with an 8 MB publication limit.

## Checks

Run `node tests/shared.test.cjs`, `node tests/auth.test.mjs`, and `node scripts/prepare.cjs`. Serve locally using `python3 -m http.server 8765`.

Bookman Old Style and Times New Roman use installed fonts with serif fallbacks. No proprietary fonts are redistributed.
