<?php
/** @var array $page  Expects: title, description, path; optional: og */
declare(strict_types=1);

$title       = $page['title'] ?? 'Waleed';
$description  = $page['description'] ?? '';
$path        = $page['path'] ?? '/';
$canonical   = rtrim(SITE_URL, '/') . $path;
$ogImage     = $page['og'] ?? (rtrim(SITE_URL, '/') . '/og.png');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width">

    <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.jpg">
    <link rel="icon" href="/favicon/favicon.jpg" sizes="32x32">
    <link rel="icon" href="/favicon/favicon.jpg" type="image/jpeg">

    <title><?= h($title) ?></title>
    <meta name="description" content="<?= attr($description) ?>">
    <link rel="canonical" href="<?= attr($canonical) ?>">
    <link rel="sitemap" href="/sitemap-index.xml">

    <meta property="og:url" content="<?= attr($canonical) ?>">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?= attr($title) ?>">
    <meta property="og:description" content="<?= attr($description) ?>">
    <meta property="og:image" content="<?= attr($ogImage) ?>">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= attr($title) ?>">
    <meta name="twitter:description" content="<?= attr($description) ?>">
    <meta name="twitter:image" content="<?= attr($ogImage) ?>">

    <link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/assets/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin>

    <?php if (UMAMI_ID): ?>
    <script defer src="https://cloud.umami.is/script.js" data-website-id="<?= attr(UMAMI_ID) ?>"></script>
    <?php endif; ?>

    <!-- Theme: applied before paint to avoid a flash. Plain MPA, runs on every load. -->
    <script>
      (function () {
        var stored = null;
        try { stored = localStorage.getItem('theme'); } catch (e) {}
        var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');
      })();
    </script>

    <link rel="stylesheet" href="/assets/utilities.css">
    <link rel="stylesheet" href="/assets/components.css">

    <style>
      /* Native cross-page view transitions — zero JS, replaces Astro's ClientRouter. */
      @view-transition { navigation: auto; }
      /* Match the html background to the body so no white flash shows during the crossfade. */
      html { background-color: var(--bg-color); }
    </style>
</head>
<body class="uno-myahde" style="background-color: var(--bg-color);">
