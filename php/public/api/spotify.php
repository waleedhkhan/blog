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

if (!Spotify::configured()) {
    echo json_encode([]);
    return;
}

try {
    $token = Spotify::accessToken();
    $current = Spotify::nowPlaying($token);
    $recent = Spotify::recentlyPlayed($token, $limit);

    if ($current !== null) {
        $recent = array_values(array_filter(
            $recent,
            static fn ($t) => !($t['name'] === $current['name'] && $t['artist'] === $current['artist'])
        ));
        $tracks = array_merge([$current], array_slice($recent, 0, $limit - 1));
    } else {
        $tracks = $recent;
    }

    echo json_encode($tracks, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable) {
    echo json_encode([]);
}
