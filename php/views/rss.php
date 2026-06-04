<?php
/** @var array $posts */
declare(strict_types=1);

$xmlEsc = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8');

$out = '<?xml version="1.0" encoding="UTF-8"?>';
$out .= '<rss version="2.0">';
$out .= '<channel>';
$out .= '<title>' . $xmlEsc("Waleed's Blog") . '</title>';
$out .= '<description>' . $xmlEsc("Food for thoughts or just Waleed's passing whims in form of writings") . '</description>';
$out .= '<link>' . SITE_URL . '/</link>';
$out .= '<language>en-us</language>';

foreach ($posts as $p) {
    $url = SITE_URL . '/posts/' . $p['slug'] . '/';
    $out .= '<item>';
    $out .= '<title>' . $xmlEsc($p['title']) . '</title>';
    $out .= '<link>' . $xmlEsc($url) . '</link>';
    $out .= '<guid isPermaLink="true">' . $xmlEsc($url) . '</guid>';
    $out .= '<description>' . $xmlEsc($p['description'] ?: $p['subtitle']) . '</description>';
    $out .= '<pubDate>' . $p['date']->format('D, d M Y H:i:s') . ' GMT</pubDate>';
    $out .= '</item>';
}

$out .= '</channel></rss>';
echo $out;
