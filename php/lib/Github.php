<?php

declare(strict_types=1);

/**
 * Fetches recent commits from the GitHub API for the colophon changelog.
 * Cached to a temp file (1h) so we don't hit the API on every request, and
 * fails gracefully (empty list) when offline or rate-limited.
 */
final class Github
{
    private const REPO  = 'waleedhkhan/blog';
    private const TTL   = 3600;

    /** @return list<array{message:string,short:string,type:string,url:string,author:string,avatar:string,date:string}> */
    public static function commits(int $limit = 30): array
    {
        $raw = self::fetchCached($limit);
        $out = [];
        foreach ($raw as $c) {
            $message = (string) ($c['commit']['message'] ?? '');
            $first = strtok($message, "\n") ?: $message;
            try {
                $date = new DateTimeImmutable((string) ($c['commit']['author']['date'] ?? 'now'));
            } catch (Exception) {
                $date = new DateTimeImmutable('now');
            }
            $out[] = [
                'message' => $first,
                'short' => substr((string) ($c['sha'] ?? ''), 0, 7),
                'type' => self::classify($first),
                'url' => (string) ($c['html_url'] ?? ''),
                'author' => (string) ($c['commit']['author']['name'] ?? ''),
                'avatar' => (string) ($c['author']['avatar_url'] ?? ''),
                'date' => $date->format('M j, Y'),
                'iso' => $date->format('c'),
            ];
        }
        return $out;
    }

    /** Group commits by their conventional-commit type, preserving a stable order. */
    public static function grouped(int $limit = 30): array
    {
        $order = ['feat', 'fix', 'chore', 'docs', 'refactor', 'style', 'other'];
        $groups = [];
        foreach (self::commits($limit) as $c) {
            $groups[$c['type']][] = $c;
        }
        uksort($groups, static fn ($a, $b) => array_search($a, $order, true) <=> array_search($b, $order, true));
        return $groups;
    }

    private static function classify(string $message): string
    {
        if (preg_match('/^(\w+)(\([^)]*\))?!?:/', $message, $m)) {
            $type = strtolower($m[1]);
            return in_array($type, ['feat', 'fix', 'chore', 'docs', 'refactor', 'style'], true) ? $type : 'other';
        }
        return 'other';
    }

    private static function fetchCached(int $limit): array
    {
        $cache = sys_get_temp_dir() . '/waleed_blog_commits.json';
        if (is_readable($cache) && (time() - filemtime($cache)) < self::TTL) {
            $data = json_decode((string) file_get_contents($cache), true);
            if (is_array($data)) {
                return $data;
            }
        }

        $ch = curl_init('https://api.github.com/repos/' . self::REPO . '/commits?per_page=' . $limit);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_USERAGENT => 'waleed.de-colophon',
            CURLOPT_HTTPHEADER => ['Accept: application/vnd.github+json'],
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($code !== 200 || !is_string($body)) {
            return [];
        }
        $data = json_decode($body, true);
        if (!is_array($data)) {
            return [];
        }
        @file_put_contents($cache, $body);
        return $data;
    }
}
