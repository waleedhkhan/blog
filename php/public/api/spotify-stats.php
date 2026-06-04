<?php

declare(strict_types=1);

/*
 * Listening stats for the /listening dashboard.
 * Usage: /api/spotify-stats.php?time_range=short_term|medium_term|long_term
 */

const BASE_PATH = __DIR__ . '/../..';
require BASE_PATH . '/lib/helpers.php';
require BASE_PATH . '/lib/Spotify.php';
load_env(BASE_PATH . '/.env');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: max-age=300');
header('X-Content-Type-Options: nosniff');

$range = (string) (filter_input(INPUT_GET, 'time_range') ?? 'short_term');
if (!in_array($range, ['short_term', 'medium_term', 'long_term'], true)) {
    $range = 'short_term';
}

$empty = ['topArtists' => [], 'topTracks' => [], 'recentTracks' => [], 'stats' => null, 'timeRange' => $range];

if (!Spotify::configured()) {
    echo json_encode($empty);
    return;
}

try {
    $token = Spotify::accessToken();
    $recent = Spotify::recentDetailed($token, 50);

    echo json_encode([
        'topArtists' => Spotify::topArtists($token, $range, 10),
        'topTracks' => Spotify::topTracks($token, $range, 10),
        'recentTracks' => $recent,
        'stats' => Spotify::computeStats($recent),
        'timeRange' => $range,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable) {
    echo json_encode($empty);
}
