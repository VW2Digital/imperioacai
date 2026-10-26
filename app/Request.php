<?php
declare(strict_types=1);

namespace ImperioAcai;

final class Request
{
    public readonly string $method;
    public readonly string $path;
    public array $params = [];
    private ?array $jsonCache = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $this->path = rtrim($path, '/') ?: '/';
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    /** Corpo JSON (ou form-data como fallback). */
    public function body(): array
    {
        if ($this->jsonCache !== null) {
            return $this->jsonCache;
        }
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input') ?: '';
            $decoded = $raw === '' ? [] : json_decode($raw, true);
            if (!is_array($decoded)) {
                throw HttpException::badRequest('JSON inválido.');
            }
            return $this->jsonCache = $decoded;
        }
        return $this->jsonCache = $_POST;
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public function param(string $name): string
    {
        return $this->params[$name] ?? '';
    }

    public function isSecure(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    }
}
