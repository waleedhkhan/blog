<?php

declare(strict_types=1);

/*
 * Front controller. Works two ways with no config difference:
 *   - PHP built-in server:  php -S localhost:8000 -t public public/index.php
 *   - Apache shared host:   .htaccess rewrites all non-files here
 */

// When run as the built-in server's router, let real files (css/js/img) serve themselves.
if (PHP_SAPI === 'cli-server') {
    $file = __DIR__ . urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    if (is_file($file)) {
        return false;
    }
}

const BASE_PATH = __DIR__ . '/..';
const SITE_URL  = 'https://www.waleed.de';

date_default_timezone_set('Europe/Berlin');

require BASE_PATH . '/lib/helpers.php';

load_env(BASE_PATH . '/.env');
define('UMAMI_ID', env('UMAMI_WEBSITE_ID', 'e4767b20-41c0-4a7b-ba76-fdbca452dfe1'));

require BASE_PATH . '/lib/Content.php';
require BASE_PATH . '/lib/Github.php';
require BASE_PATH . '/lib/Spotify.php';

send_security_headers();

// --- Routing -----------------------------------------------------------
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// Support installs in a subdirectory: strip the folder the front controller
// lives in (e.g. /blog) so routes still match. Skipped under the built-in
// server, where SCRIPT_NAME is unreliable.
if (PHP_SAPI !== 'cli-server') {
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/index.php')), '/');
    if ($base !== '' && ($path === $base || str_starts_with($path, $base . '/'))) {
        $path = substr($path, strlen($base));
    }
}

$path = rtrim($path, '/');
if ($path === '') {
    $path = '/';
}

// XML feeds / sitemaps render raw (no HTML chrome) with their own content type.
$xmlRoutes = [
    '/rss.xml' => ['application/rss+xml', 'rss'],
    '/sitemap.xml' => ['application/xml', 'sitemap'],
    '/sitemap-index.xml' => ['application/xml', 'sitemap-index'],
];
if (isset($xmlRoutes[$path])) {
    [$type, $view] = $xmlRoutes[$path];
    header("Content-Type: {$type}; charset=utf-8");
    echo render($view, ['posts' => Content::posts()]);
    return;
}

[$status, $view, $data] = route($path);

http_response_code($status);
echo render($view, $data);

/**
 * Map a path to [httpStatus, view, data]. Pure function, easy to reason about.
 *
 * @return array{0:int,1:string,2:array}
 */
function route(string $path): array
{
    if ($path === '/') {
        return [200, 'home', [
            'page' => ['title' => 'Waleed | Building Impactful Digital Products', 'description' => "Hi, I'm Waleed — a software engineer based in Berlin. Personal site: writing, bookmarks, and what I'm listening to.", 'path' => '/'],
            'recent' => Content::recentPosts(6),
            'bookmarks' => array_slice(load_bookmarks(), 0, 5),
            'tracks' => Spotify::feed(6),
        ]];
    }

    if ($path === '/about') {
        return [200, 'about', [
            'page' => ['title' => 'About — Waleed', 'description' => "Waleed — software engineer and entrepreneur based in Berlin.", 'path' => '/about'],
        ]];
    }

    if ($path === '/bookmarks') {
        return [200, 'bookmarks', [
            'page' => ['title' => 'Bookmarks — Waleed', 'description' => 'A collection of useful links and resources.', 'path' => '/bookmarks'],
            'bookmarks' => load_bookmarks(),
        ]];
    }

    if ($path === '/listening') {
        return [200, 'listening', [
            'page' => ['title' => 'Listening — Waleed', 'description' => "What I've been listening to recently.", 'path' => '/listening'],
        ]];
    }

    if ($path === '/colophon') {
        return [200, 'colophon', [
            'page' => ['title' => 'Colophon — Waleed', 'description' => 'The architecture, technologies, and design behind this site.', 'path' => '/colophon'],
            'groups' => Github::grouped(30),
        ]];
    }

    if ($path === '/posts') {
        return [200, 'posts-index', [
            'page' => ['title' => 'Posts — Waleed', 'description' => 'Writing on software, AI, and building products.', 'path' => '/posts'],
            'posts' => Content::posts(),
        ]];
    }

    if (preg_match('#^/posts/([a-z0-9-]+)$#i', $path, $m)) {
        $post = Content::post($m[1]);
        if ($post === null) {
            return not_found($path);
        }
        $og = is_file(BASE_PATH . "/public/assets/og/og-{$post['slug']}.png")
            ? SITE_URL . "/assets/og/og-{$post['slug']}.png"
            : null;
        return [200, 'post', [
            'page' => [
                'title' => $post['title'] . ' — Waleed',
                'description' => $post['description'] ?: $post['subtitle'],
                'path' => $path,
                'og' => $og,
            ],
            'post' => $post,
        ]];
    }

    return not_found($path);
}

/** @return array{0:int,1:string,2:array} */
function not_found(string $path): array
{
    return [404, '404', [
        'page' => ['title' => 'Not found — Waleed', 'description' => 'Page not found', 'path' => $path],
    ]];
}

/** Load bookmarks.json, newest first. */
function load_bookmarks(): array
{
    $file = BASE_PATH . '/content/bookmarks.json';
    if (!is_readable($file)) {
        return [];
    }
    $data = json_decode((string) file_get_contents($file), true);
    $items = $data['bookmarks'] ?? [];
    usort($items, static function ($a, $b) {
        return strcmp((string) ($b['timestamp'] ?? $b['date'] ?? ''), (string) ($a['timestamp'] ?? $a['date'] ?? ''));
    });
    return $items;
}
