<?php
/** @var array $page @var array $bookmarks */
declare(strict_types=1);

// Build category counts (mirrors the original Astro logic).
$counts = ['all' => count($bookmarks)];
foreach ($bookmarks as $b) {
    foreach (array_map('trim', explode(',', strtolower((string) ($b['category'] ?? '')))) as $cat) {
        if ($cat !== '') {
            $counts[$cat] = ($counts[$cat] ?? 0) + 1;
        }
    }
}
$categories = array_keys($counts);
$rest = array_slice($categories, 1);
sort($rest);
$categories = array_merge(['all'], $rest);

$total = count($bookmarks);

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
    <section class="space-y-4">
        <div class="container max-w-4xl mx-auto px-4 pt-6 pb-2 flex flex-col items-center justify-center">
            <div class="mb-4"><?php partial('logo', ['class' => 'w-16 h-[72px]']); ?></div>
            <h1 class="text-3xl font-medium text-gray-900 dark:text-white">Bookmarks</h1>
        </div>

        <div class="w-full max-w-3xl mx-auto px-4">
            <div class="flex justify-center items-center mb-6">
                <div class="relative w-full max-w-md">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input type="search" id="search-input" class="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5" placeholder="Search bookmarks..." />
                </div>
            </div>

            <div class="flex flex-col gap-4 mb-8">
                <div class="filter-group">
                    <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categories</h3>
                    <div class="flex flex-wrap gap-2 categories-container">
                        <?php foreach ($categories as $cat): ?>
                        <button
                            class="category-chip <?= $cat === 'all' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-gray-200' ?> px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                            data-category="<?= attr($cat) ?>" type="button">
                            <?= h($cat === 'all' ? 'All' : $cat) ?> <span class="opacity-60 ml-1">(<?= (int) $counts[$cat] ?>)</span>
                        </button>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>

        <div id="bookmarks-container" class="w-full max-w-3xl mx-auto pb-8">
            <ul class="list-none pl-0 space-y-3">
                <?php foreach ($bookmarks as $i => $b):
                    $cats = implode(' ', array_map('trim', explode(',', strtolower((string) ($b['category'] ?? ''))))); ?>
                <li class="bookmark-card group w-full relative border-b border-gray-200 dark:border-neutral-800 pb-3 transition-colors duration-200"
                    data-categories="<?= attr($cats) ?>" data-url="<?= attr($b['url'] ?? '') ?>">
                    <div class="flex items-baseline justify-between mb-1">
                        <div class="flex items-baseline gap-3 min-w-0 flex-1">
                            <span class="font-mono text-sm text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0"><?= $total - $i ?></span>
                            <a href="<?= attr($b['url'] ?? '#') ?>" target="_blank" rel="noopener noreferrer" class="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"><?= h($b['name'] ?? '') ?></a>
                        </div>
                        <div class="flex-shrink-0">
                            <span class="text-xs text-gray-500 dark:text-gray-400"><?= h($bookmarkDate($b)) ?></span>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 ml-9 line-clamp-2"><?= h($b['description'] ?? 'No description available') ?></p>
                </li>
                <?php endforeach; ?>
            </ul>
        </div>

        <div id="no-results" class="hidden text-center py-8">
            <p class="text-gray-600 dark:text-gray-400">No bookmarks found matching your search.</p>
        </div>
    </section>
</main>
<?php
$page['scripts'] = ['/assets/bookmarks.js'];
partial('footer', ['page' => $page]);
