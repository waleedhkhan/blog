<?php
/** @var array $page @var array $posts */
declare(strict_types=1);

partial('head', ['page' => $page]);
partial('nav', ['page' => $page]);
?>
<main class="uno-w8gqri">
    <div class="uno-czaanu">
        <header class="uno-8v9lwx">
            <div class="uno-oiayqn">
                <h1 class="uno-zokjt6">Posts</h1>
            </div>
        </header>
        <div class="uno-rn6qgu">
            <ul class="uno-pfikq2">
                <?php foreach ($posts as $p): ?>
                <li>
                    <div class="flex flex-col md:flex-row justify-between">
                        <div>
                            <a href="/posts/<?= attr($p['slug']) ?>" class="uno-wdsf0w"><?= h($p['title']) ?></a>
                            <?php if ($p['subtitle'] !== ''): ?>
                            <p class="uno-95g4ft"><?= h($p['subtitle']) ?></p>
                            <?php endif; ?>
                        </div>
                        <time class="flex-shrink-0 leading-[1.75]"><?= h($p['dateLabel']) ?></time>
                    </div>
                </li>
                <?php endforeach; ?>
            </ul>
        </div>
    </div>
</main>
<?php partial('footer', ['page' => $page]); ?>
