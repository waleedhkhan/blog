<?php

declare(strict_types=1);

/*
 * Recently played / now playing. Usage: /api/spotify.php?limit=6
 * Secrets stay server-side; fails closed (empty array) on any error.
 */

const BASE_PATH = __DIR__ . '/../..';
require BASE_PATH . '/lib/helpers.php';
require BASE_PATH . '/lib/Spotify.php';
load_env(BASE_PATH . '/.env');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: max-age=30');
header('X-Content-Type-Options: nosniff');

$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, [
    'options' => ['default' => 6, 'min_range' => 1, 'max_range' => 24],
]);

echo json_encode(Spotify::feed($limit), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
