<?php

declare(strict_types=1);

/**
 * Server-side Spotify client. Credentials (client secret + refresh token) are
 * read from the environment and never exposed to the browser.
 */
final class Spotify
{
    private const TOKEN    = 'https://accounts.spotify.com/api/token';
    private const API      = 'https://api.spotify.com/v1';

    public static function configured(): bool
    {
        return env('SPOTIFY_CLIENT_ID') && env('SPOTIFY_CLIENT_SECRET') && env('SPOTIFY_REFRESH_TOKEN');
    }

    /** @throws RuntimeException */
    public static function accessToken(): string
    {
        $id = (string) env('SPOTIFY_CLIENT_ID');
        $secret = (string) env('SPOTIFY_CLIENT_SECRET');
        $refresh = (string) env('SPOTIFY_REFRESH_TOKEN');

        [$code, $body] = self::http(self::TOKEN, [
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
        $data = json_decode($body, true);
        if ($code !== 200 || !isset($data['access_token'])) {
            throw new RuntimeException('spotify token refresh failed');
        }
        return (string) $data['access_token'];
    }

    public static function nowPlaying(string $token): ?array
    {
        [$code, $body] = self::get('/me/player/currently-playing', $token);
        if ($code !== 200) {
            return null;
        }
        $data = json_decode($body, true);
        if (empty($data['is_playing']) || empty($data['item'])) {
            return null;
        }
        return self::track($data['item']) + ['nowPlaying' => true];
    }

    public static function recentlyPlayed(string $token, int $limit): array
    {
        $fetch = min($limit * 3, 50);
        [$code, $body] = self::get("/me/player/recently-played?limit={$fetch}", $token);
        if ($code !== 200) {
            return [];
        }
        $data = json_decode($body, true);
        $seen = [];
        $out = [];
        foreach ($data['items'] ?? [] as $item) {
            $t = self::track($item['track'] ?? []);
            $t['playedAt'] = (string) ($item['played_at'] ?? '');
            $key = $t['name'] . '|' . $t['artist'];
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $out[] = $t;
            if (count($out) >= $limit) {
                break;
            }
        }
        return $out;
    }

    /** Recently played with full detail (no dedupe) — used for stats. */
    public static function recentDetailed(string $token, int $limit = 50): array
    {
        [$code, $body] = self::get("/me/player/recently-played?limit={$limit}", $token);
        if ($code !== 200) {
            return [];
        }
        $data = json_decode($body, true);
        return array_map(static function ($item) {
            $t = self::track($item['track'] ?? []);
            $t['album'] = (string) ($item['track']['album']['name'] ?? '');
            $t['duration'] = (int) ($item['track']['duration_ms'] ?? 0);
            $t['playedAt'] = (string) ($item['played_at'] ?? '');
            return $t;
        }, $data['items'] ?? []);
    }

    public static function topArtists(string $token, string $range, int $limit = 10): array
    {
        [$code, $body] = self::get("/me/top/artists?time_range={$range}&limit={$limit}", $token);
        if ($code !== 200) {
            return [];
        }
        $data = json_decode($body, true);
        return array_map(static function ($a) {
            $images = $a['images'] ?? [];
            return [
                'name' => (string) ($a['name'] ?? ''),
                'url' => (string) ($a['external_urls']['spotify'] ?? ''),
                'image' => (string) ($images[1]['url'] ?? $images[0]['url'] ?? ''),
                'genres' => array_slice($a['genres'] ?? [], 0, 3),
            ];
        }, $data['items'] ?? []);
    }

    public static function topTracks(string $token, string $range, int $limit = 10): array
    {
        [$code, $body] = self::get("/me/top/tracks?time_range={$range}&limit={$limit}", $token);
        if ($code !== 200) {
            return [];
        }
        $data = json_decode($body, true);
        return array_map(static function ($t) {
            $tr = self::track($t);
            $tr['album'] = (string) ($t['album']['name'] ?? '');
            $tr['duration'] = (int) ($t['duration_ms'] ?? 0);
            return $tr;
        }, $data['items'] ?? []);
    }

    public static function computeStats(array $recent): ?array
    {
        if ($recent === []) {
            return null;
        }
        $totalDuration = array_sum(array_column($recent, 'duration'));
        $artistCounts = [];
        $hourCounts = array_fill(0, 24, 0);
        foreach ($recent as $t) {
            $primary = explode(', ', $t['artist'])[0];
            $artistCounts[$primary] = ($artistCounts[$primary] ?? 0) + 1;
            try {
                $hour = (int) (new DateTimeImmutable($t['playedAt']))->format('G');
                $hourCounts[$hour]++;
            } catch (Exception) {
            }
        }
        arsort($artistCounts);
        return [
            'totalTracks' => count($recent),
            'totalMinutes' => (int) round($totalDuration / 60000),
            'uniqueArtists' => count($artistCounts),
            'peakListeningHour' => array_search(max($hourCounts), $hourCounts, true),
        ];
    }

    // --- low level --------------------------------------------------------

    private static function track(array $t): array
    {
        $images = $t['album']['images'] ?? [];
        return [
            'name' => (string) ($t['name'] ?? ''),
            'artist' => implode(', ', array_map(static fn ($a) => $a['name'], $t['artists'] ?? [])),
            'url' => (string) ($t['external_urls']['spotify'] ?? ''),
            'image' => (string) ($images[1]['url'] ?? $images[0]['url'] ?? ''),
        ];
    }

    private static function get(string $path, string $token): array
    {
        return self::http(self::API . $path, [
            CURLOPT_HTTPHEADER => ["Authorization: Bearer {$token}"],
        ]);
    }

    /** @return array{0:int,1:string} [statusCode, body] */
    private static function http(string $url, array $opts): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, $opts + [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return [$code, is_string($body) ? $body : ''];
    }
}
