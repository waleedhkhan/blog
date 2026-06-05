<?php
/** @var array $page @var array $recent @var array $bookmarks */
declare(strict_types=1);

$arrowRight = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-7-7l7 7l-7 7"/></svg>';
$totalBookmarks = count(load_bookmarks());

$bookmarkDate = static function (array $b): string {
    $raw = $b['date'] ?? $b['timestamp'] ?? null;
    if (!$raw) {
        return '';
    }
    try {
        return (new DateTimeImmutable((string) $raw))->format('F j, Y');
    } catch (Exception) {
        return '';
    }
};

partial('head', ['page' => $page]);
partial('nav', ['page' => $page]);
?>
<main class="uno-w8gqri">

    <section class="uno-czaanu bauhaus-stack-lg">
        <div class="uno-1si53h">
            <div class="uno-wcq4wq">
                <h1 class="uno-awd4l8">WΛLEED</h1>
                <p class="uno-4x5ql5"><span class="uno-pejve0"></span></p>
            </div>
        </div>
        <div class="col-start-1 col-end-13 md:col-start-5 space-y-4 leading-[1.75] bauhaus-content">
            <p class="text-gray-800 dark:text-gray-400">hi there! i'm waleed – welcome to my personal website! i'm a software engineer based in the vibrant city of berlin, with over a decade of experience designing and operating large-scale e-commerce systems.</p>
            <p class="text-gray-800 dark:text-gray-400">i'm passionate about creating simple, functional, and beautifully designed applications. i love diving into the latest innovations in tech, where i have a deep appreciation for high-quality, practical products that combine utility with sleek aesthetics.</p>
            <p class="text-gray-800 dark:text-gray-400">thanks for stopping by feel free to explore and connect!</p>
        </div>
    </section>

    <section class="uno-czaanu bauhaus-stack-lg">
        <h2 class="uno-7qwr5y bauhaus-title">recent posts</h2>
        <div class="col-start-1 col-end-13 md:col-start-5 md:col-end-13 space-y-4 leading-[1.75]">
            <ul class="uno-nrkyk8">
                <?php foreach ($recent as $p): ?>
                <li class="uno-1rvaug">
                    <div class="flex flex-col gap-1">
                        <a href="/posts/<?= attr($p['slug']) ?>" class="uno-kt512n"><?= h($p['title']) ?></a>
                    </div>
                    <p class="uno-rvftod"><?= h($p['dateLabel']) ?></p>
                </li>
                <?php endforeach; ?>
            </ul>
            <div class="uno-emrazq">
                <a href="/posts" class="uno-wsmzd1 bauhaus-button group">
                    <span class="uno-lb8dgh bauhaus-mono">all posts</span>
                    <?= $arrowRight ?>
                </a>
            </div>
        </div>
    </section>

    <section class="uno-czaanu bauhaus-stack-lg">
        <h2 class="uno-7qwr5y bauhaus-title">bookmarks</h2>
        <div class="col-start-1 col-end-13 md:col-start-5 md:col-end-13 space-y-4 leading-[1.75]">
            <div class="space-y-6">
                <ul class="list-none pl-0 space-y-3">
                    <?php foreach ($bookmarks as $i => $b): ?>
                    <li class="bookmark-card group w-full relative border-b border-gray-200 dark:border-neutral-800 pb-3 transition-colors duration-200" data-url="<?= attr($b['url'] ?? '') ?>">
                        <div class="flex items-baseline justify-between mb-1">
                            <div class="flex items-baseline gap-3 min-w-0 flex-1">
                                <span class="font-mono text-sm text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0"><?= $totalBookmarks - $i ?></span>
                                <a href="<?= attr($b['url'] ?? '#') ?>" target="_blank" rel="noopener noreferrer" class="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"><?= h($b['name'] ?? '') ?></a>
                            </div>
                            <div class="flex-shrink-0">
                                <span class="text-xs text-gray-500 dark:text-gray-400"><?= h($bookmarkDate($b)) ?></span>
                            </div>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 ml-9 line-clamp-2"><?= h($b['description'] ?? '') ?></p>
                    </li>
                    <?php endforeach; ?>
                </ul>
                <div class="uno-emrazq">
                    <a href="/bookmarks" class="uno-fd6o8u bauhaus-button group">
                        <span class="uno-lb8dgh bauhaus-mono">all bookmarks</span>
                        <?= $arrowRight ?>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <section class="uno-czaanu bauhaus-stack-lg">
        <h2 class="uno-7qwr5y bauhaus-title">music</h2>
        <div class="col-start-1 col-end-13 md:col-start-5 md:col-end-13 space-y-4 leading-[1.75]">
            <div id="recently-played" class="space-y-4">
                <div id="tracks-container">
                    <?php if ($tracks): ?>
                    <ul class="grid grid-cols-2 gap-4">
                        <?php foreach ($tracks as $i => $t): ?>
                        <li>
                            <a class="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800" href="<?= attr($t['url'] ?? '#') ?>" target="_blank" rel="noopener noreferrer" data-track-index="<?= $i ?>">
                                <div class="album-art-container<?= $i === 0 ? ' float' : '' ?>">
                                    <div class="album-visualizer"><span></span><span></span><span></span><span></span></div>
                                    <img src="<?= attr($t['image'] ?? '') ?>" alt="<?= attr(($t['name'] ?? '') . ' album art') ?>" class="album-art h-12 w-12 rounded-md transition-all<?= $i === 0 ? ' pulse' : '' ?>" loading="lazy" data-artist="<?= attr($t['artist'] ?? '') ?>" data-track="<?= attr($t['name'] ?? '') ?>">
                                    <div class="album-reflection"></div>
                                    <div class="album-glow"></div>
                                </div>
                                <div class="flex-1 overflow-hidden">
                                    <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-300 track-name<?= $i === 0 ? ' shimmer' : '' ?>"><?= h($t['name'] ?? '') ?></p>
                                    <p class="truncate text-xs text-gray-700 dark:text-gray-500 track-artist"><?= h($t['artist'] ?? '') ?></p>
                                </div>
                            </a>
                        </li>
                        <?php endforeach; ?>
                    </ul>
                    <?php else: ?>
                    <p class="text-sm text-gray-700 dark:text-gray-500">No recently played tracks available</p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </section>

</main>
<?php
$page['scripts'] = ['/assets/music.js'];
partial('footer', ['page' => $page]);
