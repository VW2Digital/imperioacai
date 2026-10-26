<?php
/**
 * Front controller do Império Açaí.
 *
 *  - /data/*  -> rotas internas em PHP (JSON) usadas pelo proprio site
 *  - resto    -> index.html gerado pelo Vite (SPA React)
 */
declare(strict_types=1);

define('IMPERIOACAI_PUBLIC_DIR', __DIR__);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($path === '/data' || str_starts_with($path, '/data/')) {
    $appDir = null;
    foreach ([__DIR__ . '/../app', __DIR__ . '/app'] as $candidate) {
        if (is_file($candidate . '/bootstrap.php')) {
            $appDir = realpath($candidate);
            break;
        }
    }
    if ($appDir === null) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Pasta app/ não encontrada. Envie a pasta app um nível acima do public_html.']);
        exit;
    }

    require $appDir . '/bootstrap.php';
    $router = require $appDir . '/routes.php';
    $router->dispatch(new ImperioAcai\Request());
}

// SPA: devolve o index.html do build
$index = __DIR__ . '/index.html';
if (!is_file($index)) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Império Açaí</title>'
        . '<p style="font-family:sans-serif;padding:2rem">Build do site não encontrado. Rode <code>npm run build</code> e envie a pasta <code>public/</code>.</p>';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
readfile($index);
