<?php

declare(strict_types=1);

require_once __DIR__ . '/Parsedown.php';

/**
 * Flat-file content layer. Posts are markdown files in /content/posts with a
 * simple `---` frontmatter block. No database, no build step.
 */
final class Content
{
    private const POSTS_DIR = BASE_PATH . '/content/posts';

    /** @var array<string,array>|null in-request cache */
    private static ?array $cache = null;

    /**
     * All published posts, newest first.
     * Each item: slug, title, subtitle, description, date (DateTimeImmutable),
     * dateLabel, tags, file.
     *
     * @return list<array<string,mixed>>
     */
    public static function posts(): array
    {
        if (self::$cache !== null) {
            return array_values(self::$cache);
        }

        self::$cache = [];
        foreach (glob(self::POSTS_DIR . '/*.{md,mdx}', GLOB_BRACE) ?: [] as $file) {
            $meta = self::parseFile($file);
            if ($meta === null || ($meta['draft'] ?? false)) {
                continue;
            }
            self::$cache[$meta['slug']] = $meta;
        }

        // Newest first.
        uasort(self::$cache, static fn ($a, $b) => $b['date'] <=> $a['date']);

        return array_values(self::$cache);
    }

    /** A single published post with rendered HTML body, or null if not found. */
    public static function post(string $slug): ?array
    {
        self::posts(); // ensure cache populated
        $meta = self::$cache[$slug] ?? null;
        if ($meta === null) {
            return null;
        }

        $raw = (string) file_get_contents($meta['file']);
        [, $body] = self::splitFrontmatter($raw);

        // Author-owned content (not untrusted input), so raw HTML is allowed.
        // We deliberately keep safe mode OFF — the posts use intentional inline HTML.
        $parser = new Parsedown();
        $body = self::transformMdx($body, $parser);

        [$html, $toc] = self::addHeadingAnchors($parser->text($body));

        return $meta + [
            'html' => $html,
            'toc' => $toc,
            'readingTime' => self::readingTime($body),
        ];
    }

    /** Most recent N posts (for the home page). */
    public static function recentPosts(int $limit = 6): array
    {
        return array_slice(self::posts(), 0, $limit);
    }

    // --- internals -------------------------------------------------------

    private static function parseFile(string $file): ?array
    {
        $raw = (string) file_get_contents($file);
        [$front, ] = self::splitFrontmatter($raw);
        if ($front === []) {
            return null;
        }

        $dateRaw = $front['date'] ?? $front['publishedAt'] ?? null;
        if ($dateRaw === null) {
            return null;
        }
        try {
            $date = new DateTimeImmutable((string) $dateRaw);
        } catch (Exception) {
            return null;
        }

        $slug = preg_replace('/\.(md|mdx)$/', '', basename($file)) ?? '';
        $slug = trim($slug);

        return [
            'slug' => $slug,
            'title' => (string) ($front['title'] ?? $slug),
            'subtitle' => (string) ($front['subtitle'] ?? ''),
            'description' => (string) ($front['description'] ?? $front['subtitle'] ?? ''),
            'date' => $date,
            'dateLabel' => $date->format('F j, Y'),
            'tags' => $front['tags'] ?? [],
            'draft' => filter_var($front['isDraft'] ?? false, FILTER_VALIDATE_BOOL),
            'file' => $file,
        ];
    }

    /**
     * Split a raw file into [frontmatter array, body markdown].
     * Frontmatter is a leading `---` ... `---` block of simple key: value lines
     * plus YAML-style `- item` lists.
     *
     * @return array{0: array<string,mixed>, 1: string}
     */
    private static function splitFrontmatter(string $raw): array
    {
        $raw = ltrim($raw, "\xEF\xBB\xBF"); // strip BOM
        if (!preg_match('/^---\s*\n(.*?)\n---\s*\n?(.*)$/s', $raw, $m)) {
            return [[], $raw];
        }

        $front = [];
        $currentListKey = null;
        foreach (explode("\n", $m[1]) as $line) {
            if (trim($line) === '') {
                continue;
            }
            // List item belonging to the previous key.
            if (preg_match('/^\s*-\s+(.*)$/', $line, $lm)) {
                if ($currentListKey !== null) {
                    $front[$currentListKey][] = self::unquote(trim($lm[1]));
                }
                continue;
            }
            if (preg_match('/^([A-Za-z0-9_]+):\s*(.*)$/', $line, $km)) {
                $key = $km[1];
                $value = trim($km[2]);
                if ($value === '') {
                    // Likely the start of a list.
                    $front[$key] = [];
                    $currentListKey = $key;
                } else {
                    $front[$key] = self::unquote($value);
                    $currentListKey = null;
                }
            }
        }

        return [$front, $m[2]];
    }

    private static function unquote(string $value): string
    {
        if (strlen($value) >= 2) {
            $first = $value[0];
            $last = $value[strlen($value) - 1];
            if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                return substr($value, 1, -1);
            }
        }
        return $value;
    }

    /**
     * Normalise the handful of MDX-isms in the old posts into plain HTML/markdown:
     *  - drop `import` / `export` lines (MDX component imports)
     *  - turn <DescriptionList/Term/Item> into a real <dl>/<dt>/<dd>, with the
     *    markdown inside each term/item rendered inline.
     */
    private static function transformMdx(string $body, Parsedown $parser): string
    {
        $body = preg_replace('/^\s*(import|export)\s+.*$/m', '', $body) ?? $body;

        $body = preg_replace_callback(
            '#<DescriptionList\b[^>]*>(.*?)</DescriptionList>#s',
            static function (array $m) use ($parser): string {
                $inner = preg_replace_callback(
                    '#<DescriptionTerm\b[^>]*>(.*?)</DescriptionTerm>#s',
                    static fn (array $t): string => '<dt>' . $parser->line(trim($t[1])) . '</dt>',
                    $m[1]
                ) ?? $m[1];
                $inner = preg_replace_callback(
                    '#<DescriptionItem\b[^>]*>(.*?)</DescriptionItem>#s',
                    static fn (array $t): string => '<dd>' . $parser->line(trim($t[1])) . '</dd>',
                    $inner
                ) ?? $inner;
                // Collapse whitespace between tags so Parsedown treats it as one HTML block.
                $inner = preg_replace('/>\s+</', '><', trim($inner)) ?? $inner;
                return "\n\n<dl class=\"description-list\">{$inner}</dl>\n\n";
            },
            $body
        ) ?? $body;

        return trim($body);
    }

    /**
     * Add stable id attributes to h2/h3 headings (for deep links) and build a
     * table of contents.
     *
     * @return array{0:string, 1:list<array{level:int,text:string,id:string}>}
     */
    private static function addHeadingAnchors(string $html): array
    {
        $toc = [];
        $used = [];
        $html = preg_replace_callback(
            '#<(h2|h3)>(.*?)</\1>#s',
            static function (array $m) use (&$toc, &$used): string {
                $tag = $m[1];
                $text = trim(html_entity_decode(strip_tags($m[2]), ENT_QUOTES, 'UTF-8'));
                $id = self::slugify($text);
                // Ensure uniqueness within the document.
                $base = $id;
                $n = 2;
                while (isset($used[$id])) {
                    $id = $base . '-' . $n++;
                }
                $used[$id] = true;
                $toc[] = ['level' => $tag === 'h2' ? 2 : 3, 'text' => $text, 'id' => $id];
                return "<{$tag} id=\"{$id}\">{$m[2]}<a class=\"heading-anchor\" href=\"#{$id}\" aria-hidden=\"true\">#</a></{$tag}>";
            },
            $html
        ) ?? $html;

        return [$html, $toc];
    }

    private static function slugify(string $text): string
    {
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? $text;
        return trim($text, '-') ?: 'section';
    }

    private static function readingTime(string $body): int
    {
        $words = str_word_count(strip_tags($body));
        return max(1, (int) ceil($words / 200));
    }
}
