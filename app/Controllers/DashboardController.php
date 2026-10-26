<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Database;
use ImperioAcai\Request;

final class DashboardController
{
    public function stats(Request $request): array
    {
        $count = static fn(string $sql): int => (int) (Database::one($sql)['c'] ?? 0);

        return [
            'products' => $count('SELECT COUNT(*) AS c FROM products'),
            'products_active' => $count('SELECT COUNT(*) AS c FROM products WHERE active = 1'),
            'products_new' => $count('SELECT COUNT(*) AS c FROM products WHERE is_new = 1 AND active = 1'),
            'categories' => $count('SELECT COUNT(*) AS c FROM categories'),
            'banners' => $count('SELECT COUNT(*) AS c FROM banners WHERE active = 1'),
            'links' => $count('SELECT COUNT(*) AS c FROM links WHERE active = 1'),
            'by_category' => Database::all(
                'SELECT c.id, c.name, COUNT(p.id) AS total
                 FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.active = 1
                 GROUP BY c.id, c.name ORDER BY c.sort_order'
            ),
        ];
    }
}
