# Publishing options

## Publish through GitHub (available now)

In the website editor, open Publish → Download publishing file. It produces `shared-profile.json`, containing your current draft, CV details and figures. Choose Open GitHub upload, select that file, and commit the update to the main branch. GitHub Pages deploys automatically. No Cloudflare account is required for this route. A website backup has a different purpose; use the dedicated publishing file.

## Sign-in publishing

The live website is connected to `https://sourav-website-publisher.souravdotg2.workers.dev`. Open the website editor → Publish → Sign in with GitHub, then review and publish your draft. Only `CoderOnTheRoad` can publish. The instructions below describe how to recreate the service.

Create your own Cloudflare account at https://dash.cloudflare.com/sign-up and verify your email. Account registration and accepting its terms must be completed by you. Once signed in, the Worker and GitHub OAuth connection below can be configured. Do not share your password or secret keys in chat.

### Service configuration

The public website is hosted on GitHub Pages. GitHub Pages cannot run OAuth callback code, so the publishing service runs separately as a Cloudflare Worker. No passwords, tokens or OAuth secrets belong in this repository.

## 1. Deploy the publishing service

Use your Cloudflare account to deploy `server/auth-worker.mjs` with `server/wrangler.toml`. The shared validator at `shared.js` must be bundled too. Use Cloudflare's official Wrangler tooling from the server directory, or its Git integration. Keep the configured GitHub repository and owner pinned to this website.

Set these non-secret Worker variables:

- `GITHUB_OWNER`: `CoderOnTheRoad`
- `GITHUB_REPO`: `sourav-ghosh-website`
- `SITE_ORIGIN`: `https://coderontheroad.github.io`
- `ADMIN_URL`: `https://coderontheroad.github.io/sourav-ghosh-website/admin.html`
- `GITHUB_CLIENT_ID`: the public OAuth app client ID (configured in `server/wrangler.toml`).

The origin excludes the path; ADMIN_URL includes the actual project path. Record the Worker's HTTPS URL.

## 2. Register a GitHub OAuth App

In GitHub → Settings → Developer settings → OAuth Apps, register a new app for this website.

- Homepage URL: the published personal-website URL.
- Authorization callback URL: `https://YOUR-WORKER-URL/callback`.

The application requests `public_repo` so your authenticated GitHub session can commit the website's profile. The service only permits the configured owner and only writes `shared-profile.json` in the configured repository. GitHub presents its own authorization screen when signing in.

## 3. Add secrets to the Worker

Use Cloudflare's secret settings (or `wrangler secret put`) to set:

- `GITHUB_CLIENT_SECRET`
- `SESSION_SECRET`: a random 32-byte value encoded as base64; generate it locally using `openssl rand -base64 32` and place it directly in the Worker secret setting. Never commit it or paste it into chat.

Deploy the Worker with these settings. Sessions expire after two hours; the GitHub token is held inside an encrypted session, not stored in repository content. OAuth state uses an encrypted, secure, HttpOnly cookie and is checked on callback. The publish endpoint checks origin, session, current GitHub identity and repository write permission.

## 4. Connect the website

Set `authBase` in `publish-config.json` to the Worker's HTTPS URL and commit that non-secret configuration. Do not put a client secret or token in this file.

Open `admin.html` → Publish → Sign in with GitHub. After authorization, review your draft and choose Publish changes. One commit updates the shared profile; GitHub Actions then validates and deploys it.

## Current state

The Worker and GitHub OAuth app are configured, and `publish-config.json` points to the live service. Credentials are stored in Cloudflare, never in this repository. Manual GitHub upload remains available as an alternative.
