<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Database;
use ImperioAcai\HttpException;
use ImperioAcai\Request;

final class SettingsController
{
    /** Chaves permitidas (evita gravar lixo na tabela). */
    private const KEYS = [
        'site_name', 'tagline', 'logo_url', 'whatsapp_number', 'whatsapp_display',
        'instagram_handle', 'address', 'maps_url', 'maps_embed_url', 'opening_hours', 'opening_schedule',
        'new_arrivals_title', 'footer_credit_label', 'footer_credit_url', 'primary_color',
    ];

    public function update(Request $request): array
    {
        $body = $request->body();
        if ($body === []) {
            throw HttpException::badRequest('Nenhuma configuração enviada.');
        }

        $pdo = Database::pdo();
        $stmt = $pdo->prepare('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)');
        $pdo->beginTransaction();
        try {
            foreach ($body as $key => $value) {
                if (!in_array($key, self::KEYS, true)) {
                    continue;
                }
                if (!is_scalar($value) && $value !== null) {
                    throw HttpException::unprocessable("Valor inválido para $key.");
                }
                $stored = $value === null ? null : trim((string) $value);
                if ($key === 'opening_schedule') {
                    $stored = self::normalizeSchedule($stored ?? '');
                }
                $stmt->execute([$key, $stored]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        return (new MenuController())->settings($request);
    }

    /** Semana fixa (seg a dom) com horarios HH:MM ou dia fechado. */
    private static function normalizeSchedule(string $raw): string
    {
        if ($raw === '') {
            return '';
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw HttpException::unprocessable('Horários inválidos.');
        }

        $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        $byDay = [];
        foreach ($data as $item) {
            if (!is_array($item)) {
                continue;
            }
            $day = (string) ($item['day'] ?? '');
            if (!in_array($day, $days, true)) {
                continue;
            }
            $byDay[$day] = [
                'day' => $day,
                'closed' => !empty($item['closed']),
                'open' => self::timeOrEmpty($item['open'] ?? ''),
                'close' => self::timeOrEmpty($item['close'] ?? ''),
                'open2' => self::timeOrEmpty($item['open2'] ?? ''),
                'close2' => self::timeOrEmpty($item['close2'] ?? ''),
            ];
        }

        $out = [];
        foreach ($days as $day) {
            $out[] = $byDay[$day] ?? ['day' => $day, 'closed' => false, 'open' => '', 'close' => '', 'open2' => '', 'close2' => ''];
        }
        return json_encode($out, JSON_UNESCAPED_UNICODE) ?: '';
    }

    private static function timeOrEmpty(mixed $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }
        if (preg_match('/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/', $value)) {
            return substr($value, 0, 5);
        }
        throw HttpException::unprocessable('Use horários no formato HH:MM.');
    }
}
