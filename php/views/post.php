<?php
/** @var array $page @var array $post */
declare(strict_types=1);

partial('head', ['page' => $page]);
partial('nav', ['page' => $page]);
?>
<main class="uno-w8gqri">
    <article class="uno-czaanu">
        <?php if (!empty($post['toc'])): ?>
        <details class="post-toc">
            <summary aria-label="Table of contents">
                <svg width="1em" height="1em" viewBox="0 0 24 24" class="w-5 h-auto" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 5H3m13 7H3m13 7H3M21 5h.01M21 12h.01M21 19h.01"/></svg>
                <span>Contents</span>
            </summary>
            <nav class="post-toc-list">
                <?php foreach ($post['toc'] as $item): ?>
                <a href="#<?= attr($item['id']) ?>" class="toc-link toc-l<?= (int) $item['level'] ?>"><?= h($item['text']) ?></a>
                <?php endforeach; ?>
            </nav>
        </details>
        <?php endif; ?>
        <header>
            <h1 class="uno-x9okhj"><?= h($post['title']) ?></h1>
            <div class="uno-n9qno3">
                <div class="flex items-center space-x-2 text-sm" title="Published <?= h($post['date']->format('D M j Y')) ?>">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" class="w-4 h-auto" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 21h8M15 5l4 4m2.174-2.188a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                    <time datetime="<?= attr($post['date']->format('c')) ?>" class="uno-klxfe1"><?= h($post['dateLabel']) ?></time>
                </div>
                <div class="flex items-center space-x-2 text-sm md:ml-auto!" title="<?= $post['readingTime'] ?> minutes read">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" class="w-4 h-auto" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 2h4m-2 12l3-3"/><circle cx="12" cy="14" r="8"/></svg>
                    <p class="font-medium"><?= $post['readingTime'] ?> minutes read</p>
                </div>
            </div>
        </header>
        <div class="uno-kugnmv">
            <?= $post['html'] ?>
        </div>
    </article>
</main>
<?php partial('footer', ['page' => $page]); ?>
