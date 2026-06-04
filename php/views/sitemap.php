<?php
/** @var array $posts */
declare(strict_types=1);

$loc = static fn (string $path): string => htmlspecialchars(SITE_URL . $path, ENT_QUOTES | ENT_XML1, 'UTF-8');

$paths = ['', '/about', '/posts', '/bookmarks', '/listening', '/colophon'];
foreach ($posts as $p) {
    $paths[] = '/posts/' . $p['slug'];
}

$out = '<?xml version="1.0" encoding="UTF-8"?>';
$out .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
foreach ($paths as $path) {
    $out .= '<url><loc>' . $loc($path) . '</loc></url>';
}
$out .= '</urlset>';
echo $out;
