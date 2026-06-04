<?php
/** @var array $page @var array $groups */
declare(strict_types=1);

$githubIcon = '<svg width="1em" height="1em" viewBox="0 0 24 24" class="uno-o1jr3t" aria-hidden="true"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>';
$extIcon = '<svg width="1em" height="1em" viewBox="0 0 24 24" class="uno-t8ltru" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>';

$typeMeta = [
    'feat' => ['label' => 'Feature', 'color' => 'text-emerald-600 dark:text-emerald-400', 'icon' => '<circle cx="12" cy="12" r="10"/><path d="M8 12h8m-4-4v8"/>'],
    'fix' => ['label' => 'Fix', 'color' => 'text-amber-600 dark:text-amber-400', 'icon' => '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'],
    'chore' => ['label' => 'Chore', 'color' => 'text-gray-500 dark:text-gray-400', 'icon' => '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'],
    'docs' => ['label' => 'Docs', 'color' => 'text-blue-600 dark:text-blue-400', 'icon' => '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'],
    'refactor' => ['label' => 'Refactor', 'color' => 'text-purple-600 dark:text-purple-400', 'icon' => '<path d="M3 7h13M3 12h9m-9 5h13"/><path d="m17 3l4 4l-4 4"/>'],
    'style' => ['label' => 'Style', 'color' => 'text-pink-600 dark:text-pink-400', 'icon' => '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688c0-.437-.18-.835-.437-1.125c-.29-.289-.438-.652-.438-1.125c0-.937.748-1.688 1.668-1.688h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>'],
    'other' => ['label' => 'Other', 'color' => 'text-gray-500 dark:text-gray-400', 'icon' => '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>'],
];

partial('head', ['page' => $page]);
partial('nav', ['page' => $page]);
?>
<main class="uno-w8gqri">
    <section class="uno-ayfvdz">
        <div class="uno-9waw7q">
            <h1 class="text-3xl font-semibold text-gray-900 dark:text-gray-300">Colophon</h1>
            <div class="mt-2 md:mt-4 space-y-0 space-x-4 md:space-y-2 md:space-x-0 flex md:flex-col">
                <p class="uno-mtzstu">
                    <?= $githubIcon ?>
                    <a href="https://github.com/waleedhkhan/blog/commits/main/" class="text-xs text-gray-700 dark:text-gray-400">waleedhkhan/blog</a>
                </p>
            </div>
        </div>
        <div class="uno-ys3zok">
            <p class="text-gray-700 dark:text-gray-400">This page details the architecture, technologies, and design principles behind this website. It serves as both documentation and a tribute to the tools that make this site possible.</p>
        </div>
    </section>

    <section class="uno-ayfvdz">
        <h2 class="uno-x65h0m">Architecture</h2>
        <div class="uno-ys3zok">
            <p class="text-gray-700 dark:text-gray-400">This website is intentionally simple: <strong class="text-gray-900 dark:text-gray-300">plain PHP, flat files, no build step</strong>. Pages are server-rendered templates, content lives as markdown files, and there is no database and no JavaScript framework.</p>
            <p class="text-gray-700 dark:text-gray-400">A single front controller handles routing with clean URLs. Page-to-page navigation uses the browser's native CSS <strong class="text-gray-900 dark:text-gray-300">View Transitions</strong> — no client-side router required.</p>
            <p class="text-gray-700 dark:text-gray-400">It runs on ordinary <a href="https://www.php.net/" class="uno-ggk82p">PHP</a> hosting. The only server-side dynamic feature is a small proxy that talks to the Spotify API, keeping the credentials off the client.</p>
        </div>
    </section>

    <section class="uno-ayfvdz">
        <h2 class="uno-x65h0m">Core Technologies</h2>
        <div class="uno-ys3zok">
            <ul class="uno-5aa8yz">
                <li><strong class="text-gray-900 dark:text-gray-300">PHP 8</strong> — server-rendered templates with a tiny front controller, no framework</li>
                <li><strong class="text-gray-900 dark:text-gray-300">Parsedown</strong> — a single-file markdown parser for blog posts</li>
                <li><strong class="text-gray-900 dark:text-gray-300">Hand-written CSS</strong> — utility classes plus a small component layer, served as static files</li>
                <li><strong class="text-gray-900 dark:text-gray-300">Vanilla JavaScript</strong> — small, dependency-free scripts for the few interactive bits</li>
                <li><strong class="text-gray-900 dark:text-gray-300">Native View Transitions</strong> — smooth page changes with zero JavaScript</li>
            </ul>
            <p class="text-gray-700 dark:text-gray-400">The site integrates with the <a href="https://developer.spotify.com/" class="uno-ggk82p">Spotify API</a> to display recently played tracks and listening stats, fetched server-side.</p>
        </div>
    </section>

    <section class="uno-ayfvdz">
        <h2 class="uno-x65h0m">Changelog</h2>
        <div class="uno-rnbutl">
            <p class="uno-ejsnme">The latest changes to this website, pulled from the GitHub commit history and grouped by type.</p>
            <?php if ($groups === []): ?>
            <p class="text-gray-700 dark:text-gray-400">Changelog is currently unavailable.</p>
            <?php else: ?>
            <div class="uno-m3ncee">
                <?php foreach ($groups as $type => $commits): $meta = $typeMeta[$type] ?? $typeMeta['other']; ?>
                <div class="uno-pfikq2">
                    <h3 class="uno-gj5511">
                        <svg width="1em" height="1em" viewBox="0 0 24 24" class="uno-1e6gcq <?= $meta['color'] ?>" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><?= $meta['icon'] ?></svg>
                        <span><?= h($meta['label']) ?></span>
                    </h3>
                    <div class="uno-ytsssi">
                        <table class="uno-3g66j9">
                            <thead>
                                <tr class="uno-aka4v2">
                                    <th class="uno-62p727"></th>
                                    <th class="uno-hpr8za">Change</th>
                                    <th class="uno-akunqf">Author</th>
                                    <th class="uno-akunqf">Date</th>
                                </tr>
                            </thead>
                            <tbody class="uno-iqflba">
                                <?php foreach ($commits as $c): ?>
                                <tr class="uno-2q6l3q group">
                                    <td class="uno-uvxh4m">
                                        <div class="uno-3bkj9d">
                                            <?php if ($c['avatar']): ?><img src="<?= attr($c['avatar']) ?>" alt="<?= attr($c['author']) ?>" class="uno-le5oeb" width="32" height="32" loading="lazy"><?php endif; ?>
                                        </div>
                                    </td>
                                    <td class="uno-uvxh4m">
                                        <a href="<?= attr($c['url']) ?>" target="_blank" rel="noopener noreferrer" class="uno-jmi7kt group">
                                            <span class="uno-h6kmsl"><?= h($c['message']) ?></span>
                                            <?= $extIcon ?>
                                        </a>
                                    </td>
                                    <td class="uno-hp6kfw"><?= h($c['author']) ?></td>
                                    <td class="uno-hp6kfw"><time datetime="<?= attr($c['iso']) ?>"><?= h($c['date']) ?></time></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
    </section>
</main>
<?php partial('footer', ['page' => $page]); ?>
