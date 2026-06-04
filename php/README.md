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

## Not yet ported (next steps)

`/about`, `/colophon`, `/listening`, and the full `/bookmarks` page with
category filtering. RSS/sitemap can be regenerated or served as static files.
