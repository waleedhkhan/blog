<?php

declare(strict_types=1);

/**
 * Tiny helper layer shared by every template.
 * No framework, no autoloader magic — just functions.
 */

/** Escape for HTML output. Use on EVERY dynamic value printed into markup. */
function h(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Escape a value for use inside an HTML attribute (alias of h, kept for intent). */
function attr(?string $value): string
{
    return h($value);
}

/** Read an environment variable, falling back to a default. */
function env(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    return ($value === false || $value === null || $value === '') ? $default : (string) $value;
}

/**
 * Load a .env file (KEY=VALUE per line) into $_ENV if present.
 * Kept outside the web root in production; harmless if missing.
 */
function load_env(string $path): void
{
    if (!is_readable($path)) {
        return;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        // Strip optional surrounding quotes.
        if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'")) {
            $value = substr($value, 1, -1);
        }
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

/** Render a view file with the given variables and return the HTML string. */
function render(string $view, array $data = []): string
{
    extract($data, EXTR_SKIP);
    ob_start();
    require BASE_PATH . "/views/{$view}.php";
    return (string) ob_get_clean();
}

/** Include a partial (head/nav/footer) with access to the current scope's $page. */
function partial(string $name, array $data = []): void
{
    extract($data, EXTR_SKIP);
    require BASE_PATH . "/partials/{$name}.php";
}

/** Send standard security headers. Called once per request from the front controller. */
function send_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Frame-Options: SAMEORIGIN');
    header(
        "Content-Security-Policy: "
        . "default-src 'self'; "
        // inline theme/toggle scripts + small page scripts use 'unsafe-inline'
        . "script-src 'self' 'unsafe-inline' https://cloud.umami.is; "
        . "style-src 'self' 'unsafe-inline'; "
        // Spotify album art + umami beacon
        . "img-src 'self' data: https://i.scdn.co; "
        . "connect-src 'self' https://cloud.umami.is; "
        . "font-src 'self'; "
        . "base-uri 'self'; "
        . "frame-ancestors 'self'; "
        . "form-action 'self'"
    );
}
