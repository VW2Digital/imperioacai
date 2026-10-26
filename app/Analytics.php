<?php
declare(strict_types=1);

namespace ImperioAcai;

/**
 * Visitas e cliques da arvore de links e do cardapio.
 * Horarios em America/Sao_Paulo (sem horario de verao).
 */
final class Analytics
{
    private const TZ = 'America/Sao_Paulo';
    private const RANGES = ['today' => 0, '7d' => 6, '30d' => 29, '90d' => 89];
    private const VIEW_WINDOW_MINUTES = 30;
    private const CLICK_WINDOW_SECONDS = 3;
    private const MAX_PER_MINUTE = 40;

    private static bool $ready = false;

    public static function track(Request $request): void
    {
        self::ensure();
        if (!self::allowedOrigin() || self::isBot() || self::isStaff()) {
            return;
        }

        $body = $request->body();
        $visitor = strtolower(trim((string) ($body['visitor_id'] ?? '')));
        $surface = (string) ($body['surface'] ?? '');
        $kind = (string) ($body['kind'] ?? '');
        $type = (string) ($body['target_type'] ?? '');
        $targetId = self::targetId($body['target_id'] ?? null);

        if (!preg_match('/^[a-f0-9]{32}$/', $visitor)) {
            throw HttpException::badRequest('Visitante inválido.');
        }
        if (!in_array($surface, ['links', 'menu'], true) || !in_array($kind, ['view', 'click'], true)) {
            throw HttpException::badRequest('Evento inválido.');
        }

        $label = self::resolveLabel($surface, $kind, $type, $targetId);
        if ($label === null) {
            throw HttpException::badRequest('Alvo inválido.');
        }
        if ($kind === 'view' || ($type !== 'link' && $type !== 'product' && $type !== 'banner')) {
            $targetId = null;
        }

        $now = self::now();
        $nowSql = $now->format('Y-m-d H:i:s');

        $recent = (int) (Database::one(
            'SELECT COUNT(*) AS c FROM analytics_events WHERE visitor_id = ? AND created_at >= ?',
            [$visitor, $now->modify('-1 minute')->format('Y-m-d H:i:s')]
        )['c'] ?? 0);
        if ($recent >= self::MAX_PER_MINUTE) {
            return;
        }

        if ($kind === 'view') {
            $since = $now->modify('-' . self::VIEW_WINDOW_MINUTES . ' minutes')->format('Y-m-d H:i:s');
            $dup = Database::one(
                'SELECT id FROM analytics_events
                 WHERE visitor_id = ? AND surface = ? AND kind = ? AND created_at >= ? LIMIT 1',
                [$visitor, $surface, 'view', $since]
            );
            if ($dup) {
                return;
            }
        } else {
            $since = $now->modify('-' . self::CLICK_WINDOW_SECONDS . ' seconds')->format('Y-m-d H:i:s');
            $dup = Database::one(
                'SELECT id FROM analytics_events
                 WHERE visitor_id = ? AND surface = ? AND kind = ? AND target_type = ?
                   AND target_id <=> ? AND created_at >= ? LIMIT 1',
                [$visitor, $surface, 'click', $type, $targetId, $since]
            );
            if ($dup) {
                return;
            }
        }

        Database::insert('analytics_events', [
            'surface' => $surface,
            'kind' => $kind,
            'target_type' => $type,
            'target_id' => $targetId,
            'target_label' => $label,
            'visitor_id' => $visitor,
            'created_at' => $nowSql,
        ]);

        if (random_int(1, 50) === 1) {
            Database::run(
                'DELETE FROM analytics_events WHERE created_at < ?',
                [$now->modify('-400 days')->format('Y-m-d H:i:s')]
            );
        }
    }

    public static function report(string $range): array
    {
        self::ensure();
        if (!isset(self::RANGES[$range])) {
            throw HttpException::badRequest('Período inválido.');
        }

        $today = new \DateTimeImmutable('today', new \DateTimeZone(self::TZ));
        $start = $today->modify('-' . self::RANGES[$range] . ' days');
        $startSql = $start->format('Y-m-d H:i:s');

        $totals = [];
        foreach (Database::all(
            'SELECT surface,
                    SUM(kind = \'view\') AS visits,
                    SUM(kind = \'click\') AS clicks,
                    COUNT(DISTINCT IF(kind = \'view\', visitor_id, NULL)) AS visitors
             FROM analytics_events
             WHERE created_at >= ?
             GROUP BY surface',
            [$startSql]
        ) as $row) {
            $totals[$row['surface']] = $row;
        }

        $days = [];
        for ($cursor = $start; $cursor <= $today; $cursor = $cursor->modify('+1 day')) {
            $days[$cursor->format('Y-m-d')] = true;
        }

        $series = ['links' => [], 'menu' => []];
        foreach (array_keys($series) as $surface) {
            foreach (array_keys($days) as $day) {
                $series[$surface][$day] = ['date' => $day, 'visits' => 0, 'visitors' => 0, 'clicks' => 0];
            }
        }

        foreach (Database::all(
            'SELECT surface, kind, DATE(created_at) AS day, COUNT(*) AS total
             FROM analytics_events
             WHERE created_at >= ?
             GROUP BY surface, kind, day',
            [$startSql]
        ) as $row) {
            $surface = $row['surface'];
            $day = (string) $row['day'];
            if (!isset($series[$surface][$day])) {
                continue;
            }
            if ($row['kind'] === 'view') {
                $series[$surface][$day]['visits'] = (int) $row['total'];
            } elseif ($row['kind'] === 'click') {
                $series[$surface][$day]['clicks'] = (int) $row['total'];
            }
        }

        foreach (Database::all(
            'SELECT surface, DATE(created_at) AS day, COUNT(DISTINCT visitor_id) AS visitors
             FROM analytics_events
             WHERE created_at >= ? AND kind = \'view\'
             GROUP BY surface, day',
            [$startSql]
        ) as $row) {
            $surface = $row['surface'];
            $day = (string) $row['day'];
            if (isset($series[$surface][$day])) {
                $series[$surface][$day]['visitors'] = (int) $row['visitors'];
            }
        }

        $clicks = ['links' => [], 'menu' => []];
        foreach (Database::all(
            "SELECT surface, target_type, target_id,
                    SUBSTRING_INDEX(GROUP_CONCAT(target_label ORDER BY id DESC SEPARATOR '\x1e'), '\x1e', 1) AS label,
                    COUNT(*) AS clicks
             FROM analytics_events
             WHERE created_at >= ? AND kind = 'click'
             GROUP BY surface, target_type, target_id
             ORDER BY clicks DESC, label ASC",
            [$startSql]
        ) as $row) {
            $surface = $row['surface'];
            if (!isset($clicks[$surface])) {
                continue;
            }
            $clicks[$surface][] = [
                'target_type' => $row['target_type'],
                'target_id' => $row['target_id'] !== null ? (int) $row['target_id'] : null,
                'label' => (string) $row['label'],
                'clicks' => (int) $row['clicks'],
            ];
        }

        $fromMenu = (int) (Database::one(
            'SELECT COUNT(*) AS c
             FROM analytics_events e
             INNER JOIN links l ON l.id = e.target_id
             WHERE e.created_at >= ?
               AND e.surface = \'links\'
               AND e.kind = \'click\'
               AND e.target_type = \'link\'
               AND l.url LIKE \'%/cardapio%\'',
            [$startSql]
        )['c'] ?? 0);

        $pack = static function (string $surface) use ($totals, $series): array {
            $row = $totals[$surface] ?? ['visits' => 0, 'visitors' => 0, 'clicks' => 0];
            return [
                'visits' => (int) $row['visits'],
                'visitors' => (int) $row['visitors'],
                'clicks' => (int) $row['clicks'],
                'series' => array_values($series[$surface]),
            ];
        };

        return [
            'range' => $range,
            'from' => $start->format('Y-m-d'),
            'to' => $today->format('Y-m-d'),
            'link_to_menu' => $fromMenu,
            'links' => $pack('links') + ['clicks_by_target' => $clicks['links']],
            'menu' => $pack('menu') + ['clicks_by_target' => $clicks['menu']],
        ];
    }

    private static function ensure(): void
    {
        if (self::$ready) {
            return;
        }
        Database::run(
            'CREATE TABLE IF NOT EXISTS analytics_events (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                surface VARCHAR(16) NOT NULL,
                kind VARCHAR(16) NOT NULL,
                target_type VARCHAR(32) NOT NULL,
                target_id INT UNSIGNED DEFAULT NULL,
                target_label VARCHAR(160) NOT NULL DEFAULT \'\',
                visitor_id CHAR(32) NOT NULL,
                created_at DATETIME NOT NULL,
                PRIMARY KEY (id),
                KEY idx_analytics_period (surface, kind, created_at),
                KEY idx_analytics_visitor (visitor_id, surface, kind, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        self::$ready = true;
    }

    private static function resolveLabel(string $surface, string $kind, string $type, ?int $id): ?string
    {
        if ($kind === 'view') {
            return $type === 'page' ? ($surface === 'links' ? 'Árvore de links' : 'Cardápio') : null;
        }

        if ($type === 'whatsapp') {
            return 'WhatsApp';
        }
        if ($type === 'instagram') {
            return 'Instagram';
        }
        if ($type === 'maps') {
            return 'Mapa';
        }
        if ($type === 'credit') {
            return 'Crédito do rodapé';
        }
        if ($id === null || $id < 1) {
            return null;
        }
        if ($type === 'link' && $surface === 'links') {
            $row = Database::one('SELECT label FROM links WHERE id = ?', [$id]);
            return $row ? (string) $row['label'] : null;
        }
        if ($type === 'product' && $surface === 'menu') {
            $row = Database::one('SELECT name FROM products WHERE id = ?', [$id]);
            return $row ? (string) $row['name'] : null;
        }
        if ($type === 'banner' && $surface === 'menu') {
            $row = Database::one('SELECT title FROM banners WHERE id = ?', [$id]);
            if (!$row) {
                return null;
            }
            $title = trim((string) ($row['title'] ?? ''));
            return $title !== '' ? $title : 'Banner';
        }
        return null;
    }

    private static function targetId(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && preg_match('/^\d+$/', $value))) {
            throw HttpException::badRequest('Alvo inválido.');
        }
        $id = (int) $value;
        return $id > 0 ? $id : null;
    }

    private static function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone(self::TZ));
    }

    private static function allowedOrigin(): bool
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin === '') {
            return true;
        }
        $originHost = parse_url($origin, PHP_URL_HOST);
        if (!is_string($originHost) || $originHost === '') {
            return false;
        }
        $host = preg_replace('/:\d+$/', '', (string) ($_SERVER['HTTP_HOST'] ?? '')) ?? '';
        return strcasecmp($originHost, $host) === 0;
    }

    private static function isBot(): bool
    {
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        if ($ua === '') {
            return true;
        }
        return (bool) preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i', $ua);
    }

    /** Navegacao de quem esta logado no painel nao entra na conta. */
    private static function isStaff(): bool
    {
        if (empty($_COOKIE['imperioacai_sess'])) {
            return false;
        }
        return Auth::user() !== null;
    }
}
