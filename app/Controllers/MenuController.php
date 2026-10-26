<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Database;
use ImperioAcai\Request;

/**
 * Rotas publicas, somente leitura, consumidas pelo proprio site.
 */
final class MenuController
{
    /** Categorias ativas com seus produtos ativos, prontas para renderizar o cardapio. */
    public function index(Request $request): array
    {
        $categories = Database::all(
            'SELECT id, slug, name, image_url FROM categories WHERE active = 1 ORDER BY sort_order, id'
        );
        $products = Database::all(
            'SELECT id, category_id, name, description, price, image_url, is_new
             FROM products WHERE active = 1 ORDER BY sort_order, id'
        );

        $byCategory = [];
        foreach ($products as $p) {
            $byCategory[(int) $p['category_id']][] = [
                'id' => (int) $p['id'],
                'name' => $p['name'],
                'description' => $p['description'],
                'price' => (float) $p['price'],
                'image_url' => $p['image_url'],
                'is_new' => (bool) $p['is_new'],
            ];
        }

        $result = [];
        foreach ($categories as $c) {
            $result[] = [
                'id' => (int) $c['id'],
                'slug' => $c['slug'],
                'name' => $c['name'],
                'image_url' => $c['image_url'],
                'products' => $byCategory[(int) $c['id']] ?? [],
            ];
        }

        return [
            'categories' => $result,
            'banners' => $this->banners($request),
            'settings' => $this->settings($request),
        ];
    }

    public function banners(Request $request): array
    {
        $rows = Database::all('SELECT id, title, image_url, link_url FROM banners WHERE active = 1 ORDER BY sort_order, id');
        return array_map(static fn($b) => ['id' => (int) $b['id']] + $b, $rows);
    }

    public function links(Request $request): array
    {
        $rows = Database::all('SELECT id, label, url, icon, is_primary FROM links WHERE active = 1 ORDER BY sort_order, id');
        return array_map(static fn($l) => [
            'id' => (int) $l['id'],
            'label' => $l['label'],
            'url' => $l['url'],
            'icon' => $l['icon'],
            'is_primary' => (bool) $l['is_primary'],
        ], $rows);
    }

    public function settings(Request $request): array
    {
        $rows = Database::all('SELECT `key`, `value` FROM settings');
        $out = [];
        foreach ($rows as $row) {
            $out[$row['key']] = $row['value'];
        }
        return $out;
    }
}
