<?php
declare(strict_types=1);

namespace ImperioAcai;

define('IMPERIOACAI_APP_DIR', __DIR__);
if (!defined('IMPERIOACAI_PUBLIC_DIR')) {
    // public/index.php define isto antes de incluir o bootstrap; fallback para dev/CLI
    define('IMPERIOACAI_PUBLIC_DIR', realpath(__DIR__ . '/../public') ?: __DIR__ . '/../public');
}

// Autoload simples (sem Composer) para o namespace ImperioAcai\
spl_autoload_register(static function (string $class): void {
    $prefix = 'ImperioAcai\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $file = __DIR__ . '/' . $relative . '.php';
    if (is_file($file)) {
        require $file;
    }
});

/**
 * Carrega a configuracao: config.php (Hostinger) ou variaveis de ambiente (Docker).
 */
function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $file = __DIR__ . '/config.php';
    if (is_file($file)) {
        $config = require $file;
    } else {
        $config = [
            'db' => [
                'host' => getenv('DB_HOST') ?: 'localhost',
                'port' => (int) (getenv('DB_PORT') ?: 3306),
                'name' => getenv('DB_NAME') ?: 'imperioacai',
                'user' => getenv('DB_USER') ?: 'imperioacai',
                'pass' => getenv('DB_PASS') ?: '',
                'charset' => 'utf8mb4',
            ],
            'app_key' => getenv('APP_KEY') ?: 'insecure-default-key',
            'app_env' => getenv('APP_ENV') ?: 'production',
            'uploads' => [
                'dir' => IMPERIOACAI_PUBLIC_DIR . '/uploads',
                'public_path' => '/uploads',
                'max_mb' => 5,
            ],
        ];
    }

    $config['uploads']['dir'] = $config['uploads']['dir'] ?? (IMPERIOACAI_PUBLIC_DIR . '/uploads');
    $config['uploads']['public_path'] = $config['uploads']['public_path'] ?? '/uploads';
    $config['uploads']['max_mb'] = $config['uploads']['max_mb'] ?? 5;

    return $config;
}

function is_production(): bool
{
    return (config()['app_env'] ?? 'production') === 'production';
}

// Erros nunca vazam como HTML: tudo vira JSON
set_exception_handler(static function (\Throwable $e): void {
    $status = $e instanceof HttpException ? $e->status : 500;
    $payload = ['error' => $status === 500 && is_production() ? 'Erro interno do servidor.' : $e->getMessage()];
    if (!is_production() && $status === 500) {
        $payload['trace'] = explode("\n", $e->getTraceAsString());
        $payload['file'] = $e->getFile() . ':' . $e->getLine();
    }
    if ($e instanceof HttpException && $e->details) {
        $payload['details'] = $e->details;
    }
    Response::json($payload, $status);
});

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new \ErrorException($message, 0, $severity, $file, $line);
});
