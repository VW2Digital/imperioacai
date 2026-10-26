<?php
declare(strict_types=1);

use ImperioAcai\Controllers\AnalyticsController;
use ImperioAcai\Controllers\AuthController;
use ImperioAcai\Controllers\BannersController;
use ImperioAcai\Controllers\CategoriesController;
use ImperioAcai\Controllers\DashboardController;
use ImperioAcai\Controllers\LinksController;
use ImperioAcai\Controllers\MenuController;
use ImperioAcai\Controllers\ProductsController;
use ImperioAcai\Controllers\SettingsController;
use ImperioAcai\Controllers\UploadController;
use ImperioAcai\Router;

$r = new Router();

// ---------- Publico ----------
$r->get('/data/menu', [MenuController::class, 'index']);
$r->get('/data/banners', [MenuController::class, 'banners']);
$r->get('/data/links', [MenuController::class, 'links']);
$r->get('/data/settings', [MenuController::class, 'settings']);
$r->post('/data/track', [AnalyticsController::class, 'track']);

// ---------- Autenticacao ----------
$r->post('/data/auth/login', [AuthController::class, 'login']);
$r->post('/data/auth/logout', [AuthController::class, 'logout'], auth: true);
$r->get('/data/auth/me', [AuthController::class, 'me'], auth: true);
$r->put('/data/auth/password', [AuthController::class, 'changePassword'], auth: true);

// ---------- Admin ----------
$r->get('/data/admin/stats', [DashboardController::class, 'stats'], auth: true);
$r->get('/data/admin/insights', [AnalyticsController::class, 'insights'], auth: true);

foreach ([
    'categories' => CategoriesController::class,
    'products' => ProductsController::class,
    'banners' => BannersController::class,
    'links' => LinksController::class,
] as $resource => $controller) {
    $r->get("/data/admin/$resource", [$controller, 'index'], auth: true);
    $r->post("/data/admin/$resource", [$controller, 'store'], auth: true);
    $r->put("/data/admin/$resource/reorder", [$controller, 'reorder'], auth: true);
    $r->get("/data/admin/$resource/{id}", [$controller, 'show'], auth: true);
    $r->put("/data/admin/$resource/{id}", [$controller, 'update'], auth: true);
    $r->delete("/data/admin/$resource/{id}", [$controller, 'destroy'], auth: true);
}

$r->put('/data/admin/settings', [SettingsController::class, 'update'], auth: true);
$r->post('/data/admin/upload', [UploadController::class, 'store'], auth: true);

return $r;
