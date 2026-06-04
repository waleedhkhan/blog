<?php
/** @var array $page */
declare(strict_types=1);

partial('head', ['page' => $page]);
partial('nav', ['page' => $page]);
?>
<main class="uno-w8gqri">
    <section class="uno-czaanu bauhaus-stack-lg">
        <div class="col-start-1 col-end-13 md:col-start-5 md:col-end-13 space-y-4 leading-[1.75]">
            <h1 class="uno-awd4l8">404</h1>
            <p class="text-gray-800 dark:text-gray-400">This page doesn't exist. <a href="/" class="uno-kt512n">Head home</a>.</p>
        </div>
    </section>
</main>
<?php partial('footer', ['page' => $page]); ?>
