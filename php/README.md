# waleed.de — plain PHP version

A build-free, flat-file PHP version of the site. No framework, no Node, no
bundler. Content lives as markdown files; pages are PHP templates; styling is
the original compiled CSS reused verbatim.

## Run locally

```sh
cd php
cp .env.example .env        # optional — fill in Spotify creds for the music widget
php -S localhost:8000 -t public public/index.php
```

Open http://localhost:8000. PHP 8.3+ recommended.

## How it works

```
public/            web root (point your host here)
  index.php        front controller / router (also serves static files under php -S)
  .htaccess        Apache rewrite → index.php for shared hosting
  api/spotify.php   server-side Spotify proxy (secret never reaches the browser)
  assets/          utilities.css (compiled UnoCSS), components.css (de-scoped),
                   site.js, music.js, fonts/
views/             one file per page (home, posts-index, post, 404)
partials/          head, nav, footer, scripts
lib/               helpers.php, Content.php (markdown loader), Parsedown.php (vendored)
content/
  posts/*.md(x)    your posts with `---` frontmatter
  bookmarks.json
.env               secrets (never committed, lives above the web root)
```

- **Routing:** clean URLs (`/`, `/posts`, `/posts/{slug}`) via one front controller.
- **Page transitions:** native CSS `@view-transition { navigation: auto; }` — no JS.
- **Theme:** inline pre-paint script + a toggle; choice persisted in `localStorage`.
- **Security:** every dynamic value escaped with `h()`; CSP + nosniff headers;
  Spotify secrets read from `.env`; no database (no SQL surface).

## Deploy (shared host)

1. Upload the `php/` directory.
2. Point the domain's document root at `php/public`.
3. Put `.env` at `php/.env` (one level above the web root — it is never served).
4. Ensure `mod_rewrite` is enabled (it is on virtually all shared PHP hosts).

### Clean URLs not working? (404 on /about, /posts/...)

Almost always one of these:

- **`.htaccess` wasn't uploaded.** It's a dotfile, and many FTP clients hide
  them by default. Confirm `public/.htaccess` exists on the server next to
  `index.php`. Enable "show hidden files" in your FTP client.
- **`mod_rewrite` / `AllowOverride` off.** The host must allow `.htaccess`
  overrides for the directory. Most shared hosts do; if not, ask support to
  enable `AllowOverride All` (or `mod_rewrite`).
- **Installed in a subfolder** (e.g. `https://host/blog/` instead of its own
  domain root). The router already strips the subfolder so routes match, but
  for assets to load you should still prefer pointing the document root at
  `public/`. If you must run from a subfolder, uncomment `RewriteBase` in
  `.htaccess` and set it to that folder.

The homepage working but inner pages 404-ing is the classic signature of a
missing/ignored `.htaccess`.

## Content

Add a post by dropping a markdown file in `content/posts/` with frontmatter:

```markdown
---
title: "My Post"
subtitle: "Optional tagline"
publishedAt: 2026-06-05
tags: [ai, building]
---

Body in **markdown**.
```

The slug is the filename without extension. No rebuild needed — just refresh.

## Pages

All pages are ported: `/`, `/posts`, `/posts/{slug}`, `/about`, `/bookmarks`
(with search + category filtering), `/listening` (Spotify stats dashboard),
`/colophon` (with a live GitHub changelog), and `404`.

Two server-side endpoints back the Spotify widgets:
`/api/spotify.php` (now playing / recently played) and
`/api/spotify-stats.php` (top tracks/artists for the listening page).

## CSS provenance

`assets/utilities.css` is the compiled UnoCSS bundle, reused verbatim.
`assets/components.css` is the component CSS extracted from the old build with
the framework scoping attributes (`[data-astro-cid-*]`, `[data-v-*]`) stripped,
so the templates use clean class names. If you change the design, edit these
directly — there is no build step to regenerate them.

## Still on the old build (optional)

`rss.xml` and `sitemap-index.xml` are currently served as the static files
copied from the previous build. Regenerate them in PHP if you want them to
update automatically as posts are added.
