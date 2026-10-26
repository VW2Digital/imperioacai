<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Database;
use ImperioAcai\HttpException;
use ImperioAcai\Validator;

final class CategoriesController extends CrudController
{
    protected string $table = 'categories';
    protected array $rules = [
        'name' => 'required|string|max:120',
        'slug' => 'string|slug|max:80',
        'image_url' => 'string|max:500',
        'sort_order' => 'int',
        'active' => 'bool',
    ];

    protected function selectSql(): string
    {
        return 'SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products_count FROM categories c';
    }

    protected function present(array $row): array
    {
        $row = parent::present($row);
        $row['products_count'] = (int) ($row['products_count'] ?? 0);
        return $row;
    }

    protected function beforeSave(array $data, ?int $id): array
    {
        if ($id === null && empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Validator::slugify($data['name']);
        }
        if (!empty($data['slug'])) {
            $exists = Database::one('SELECT id FROM categories WHERE slug = ? AND id <> ?', [$data['slug'], $id ?? 0]);
            if ($exists) {
                throw HttpException::unprocessable('Já existe uma categoria com este identificador.', ['slug' => 'Slug já em uso.']);
            }
        }
        return $data;
    }

    protected function beforeDelete(int $id): void
    {
        $count = Database::one('SELECT COUNT(*) AS c FROM products WHERE category_id = ?', [$id]);
        if ((int) ($count['c'] ?? 0) > 0) {
            throw HttpException::conflict('Esta categoria possui pratos. Mova ou exclua os pratos antes.');
        }
    }
}
