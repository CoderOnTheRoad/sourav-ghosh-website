# Sourav Ghosh — personal website and CV

A buildless GitHub Pages academic website, with a shared profile, form-based draft editor and the existing academic CV maker.

- Public entry: `index.html`
- Owner editor: `admin.html`
- CV maker: `cv/index.html`
- Source of published content: `shared-profile.json`
- OAuth publishing service: `server/auth-worker.mjs` (separate from GitHub Pages)

## Editing

The editor saves a local draft in IndexedDB. Preview draft opens the same website with `?preview=1`; ordinary visitors always read the published JSON. This is not server-side private storage: use the editor on your own device. The editor interface itself is publicly downloadable, but it cannot write public content without the owner's authenticated publishing session.

The website editor and connected CV maker both read and save the draft's `cv` object. The original, separate academic-cv-studio remains unchanged. Use the connected copy to update this website. Personal writing, links, images and page settings live in `website` and do not appear in the CV. PDF and Word exports use the shared CV; publication thumbnails remain on the website.

Sections have independent website/CV visibility. Custom academic sections appear on Research. Custom website pages can be created in the editor. Changes to entries and sections are form based; the CV maker also retains drag arrangement, rich text, publication import, page controls and export styling.

Download a full website & CV backup regularly. A CV-maker backup only contains CV content, not personal pages or website figures. Draft storage does not synchronise across devices; use backup/restore to transfer an unpublished draft. Published content is available everywhere.

Images are validated and resized before storing in the shared draft. They are embedded as data URLs in the published profile so that one commit can publish content and images together. Publishing is limited to 8 MB per profile; use appropriately sized figures. Removing an image restores the neutral publication placeholder. User text is escaped before rendering; links allow HTTP(S) only and images allow raster data URLs or bundled figure assets.

## Publish

See [SETUP.md](SETUP.md). Without the OAuth service configured, public Pages hosting works and drafts/exports work, but publishing from the editor is disabled. You can still update `shared-profile.json` directly in GitHub or push a reviewed change.

GitHub Actions validates the profile and CV exports, then builds `_site`. The CV's default JSON and initial data are generated from the same published profile during deployment.

## Local preview and checks

Serve this directory using `python3 -m http.server 8765` and open the resulting local URL. Run `node tests/shared.test.cjs`, `node tests/auth.test.mjs`, and the CV checks in `cv/tests/`. `node scripts/prepare.cjs` prepares the deployment folder.

Bookman Old Style and Times New Roman use installed system fonts with serif fallbacks. No proprietary font files are redistributed. The CV includes its existing licensed CMU fonts and vendor libraries.
