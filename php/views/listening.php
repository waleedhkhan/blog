<?php
/** @var array $page */
declare(strict_types=1);

partial('head', ['page' => $page]);
partial('nav', ['page' => $page]);
?>
<main class="uno-w8gqri">
    <section>
        <h1 class="font-semibold text-2xl md:text-3xl tracking-tight mb-2">Listening</h1>
        <p class="text-gray-500 dark:text-gray-400 mb-8">What I've been listening to recently.</p>

        <div class="dashboard listening-dashboard">
            <div class="pills">
                <button class="pill active" data-range="short_term" type="button">4 weeks</button>
                <button class="pill" data-range="medium_term" type="button">6 months</button>
                <button class="pill" data-range="long_term" type="button">All time</button>
            </div>
            <div id="listening-content">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        </div>
    </section>
</main>
<?php
$page['scripts'] = ['/assets/listening.js'];
partial('footer', ['page' => $page]);
