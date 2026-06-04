<?php

declare(strict_types=1);

/*
 * Spotify "recently played / now playing" proxy.
 * The client secret + refresh token never leave the server.
 * Usage: /api/spotify.php?limit=6
 */

const BASE_PATH = __DIR__ . '/../..';
require BASE_PATH . '/lib/helpers.php';
load_env(BASE_PATH . '/.env');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: max-age=30');
header('X-Content-Type-Options: nosniff');

// Validate + clamp input.
$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, [
    'options' => ['default' => 6, 'min_range' => 1, 'max_range' => 24],
]);

$clientId     = env('SPOTIFY_CLIENT_ID');
$clientSecret = env('SPOTIFY_CLIENT_SECRET');
$refreshToken = env('SPOTIFY_REFRESH_TOKEN');

if (!$clientId || !$clientSecret || !$refreshToken) {
    // Fail closed: no creds → empty list, not an error page. Keeps the widget graceful.
    http_response_code(200);
    echo json_encode([]);
    return;
}

try {
    $token = spotify_access_token($clientId, $clientSecret, $refreshToken);
    $current = spotify_now_playing($token);
    $recent  = spotify_recently_played($token, $limit);

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
    // Never leak internals to the client.
    http_response_code(200);
    echo json_encode([]);
}

// --- helpers -----------------------------------------------------------

function spotify_http(string $url, array $opts): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, $opts + [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_FOLLOWLOCATION => false,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return [$code, is_string($body) ? $body : ''];
}

function spotify_access_token(string $id, string $secret, string $refresh): string
{
    [$code, $body] = spotify_http('https://accounts.spotify.com/api/token', [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Basic ' . base64_encode("{$id}:{$secret}"),
            'Content-Type: application/x-www-form-urlencoded',
        ],
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refresh,
        ]),
    ]);
    if ($code !== 200) {
        throw new RuntimeException('token refresh failed');
    }
    $data = json_decode($body, true);
    if (!isset($data['access_token'])) {
        throw new RuntimeException('no access token');
    }
    return (string) $data['access_token'];
}

function spotify_track(array $track): array
{
    $images = $track['album']['images'] ?? [];
    return [
        'name' => (string) ($track['name'] ?? ''),
        'artist' => implode(', ', array_map(static fn ($a) => $a['name'], $track['artists'] ?? [])),
        'url' => (string) ($track['external_urls']['spotify'] ?? ''),
        'image' => (string) ($images[1]['url'] ?? $images[0]['url'] ?? ''),
    ];
}

function spotify_now_playing(string $token): ?array
{
    [$code, $body] = spotify_http('https://api.spotify.com/v1/me/player/currently-playing', [
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}"],
    ]);
    if ($code === 204 || $code !== 200) {
        return null;
    }
    $data = json_decode($body, true);
    if (empty($data['is_playing']) || empty($data['item'])) {
        return null;
    }
    return spotify_track($data['item']) + ['nowPlaying' => true];
}

function spotify_recently_played(string $token, int $limit): array
{
    $fetch = min($limit * 3, 50);
    [$code, $body] = spotify_http("https://api.spotify.com/v1/me/player/recently-played?limit={$fetch}", [
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}"],
    ]);
    if ($code !== 200) {
        return [];
    }
    $data = json_decode($body, true);
    $seen = [];
    $tracks = [];
    foreach ($data['items'] ?? [] as $item) {
        $t = spotify_track($item['track'] ?? []);
        $t['playedAt'] = (string) ($item['played_at'] ?? '');
        $key = $t['name'] . '|' . $t['artist'];
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $tracks[] = $t;
        if (count($tracks) >= $limit) {
            break;
        }
    }
    return $tracks;
}
