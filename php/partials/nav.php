<?php
/** Bottom floating navigation. @var array $page */
declare(strict_types=1);

$current = $page['path'] ?? '/';

$items = [
    ['href' => '/',          'label' => 'Home',      'icon' => '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'],
    ['href' => '/posts',     'label' => 'Blog',      'icon' => '<path d="M15 18h-5m8-4h-8m-6 8h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="10" y="6" rx="1"/>'],
    ['href' => '/about',     'label' => 'About',     'icon' => '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'],
    ['href' => '/bookmarks', 'label' => 'Bookmarks', 'icon' => '<path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/>'],
    ['href' => '/listening', 'label' => 'Listening', 'icon' => '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>'],
];

$isActive = static function (string $href) use ($current): bool {
    return $href === '/' ? $current === '/' : str_starts_with($current, $href);
};
?>
<nav class="nav-container">
    <div class="nav-bar">
        <?php foreach ($items as $item): $active = $isActive($item['href']); ?>
            <a rel="noopener noreferrer" href="<?= attr($item['href']) ?>"
               class="nav-item<?= $active ? ' active-link' : '' ?>"
               aria-label="<?= attr($item['label']) ?>"
               <?= $active ? 'aria-current="page"' : '' ?>>
                <div class="icon-wrapper">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" class="nav-icon" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         aria-hidden="true"><?= $item['icon'] ?></svg>
                </div>
                <span class="tooltip-content nav-tooltip"><?= h($item['label']) ?></span>
            </a>
        <?php endforeach; ?>

        <div class="nav-divider"></div>

        <button id="theme-toggle" type="button" aria-label="Toggle dark mode" class="theme-toggle-button">
            <svg width="1em" height="1em" viewBox="0 0 24 24" class="w-5 h-5 sun-icon" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <svg width="1em" height="1em" viewBox="0 0 24 24" class="w-5 h-5 moon-icon" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
            </svg>
        </button>
    </div>
</nav>
