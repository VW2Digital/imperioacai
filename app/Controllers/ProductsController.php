<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Database;
use ImperioAcai\HttpException;

final class ProductsController extends CrudController
{
    protected string $table = 'products';
    protected string $orderBy = 'c.sort_order, p.sort_order, p.id';
    protected array $rules = [
        'category_id' => 'required|int',
        'name' => 'required|string|max:160',
        'description' => 'string|max:2000',
        'price' => 'required|decimal',
        'image_url' => 'string|max:500',
        'is_new' => 'bool',
        'sort_order' => 'int',
        'active' => 'bool',
    ];

    protected function selectSql(): string
    {
        return 'SELECT p.*, c.name AS category_name, c.slug AS category_slug
                FROM products p
                INNER JOIN categories c ON c.id = p.category_id';
    }

    protected function present(array $row): array
    {
        $row = parent::present($row);
        $row['category_id'] = (int) $row['category_id'];
        $row['price'] = (float) $row['price'];
        $row['is_new'] = (bool) $row['is_new'];
        return $row;
    }

    protected function beforeSave(array $data, ?int $id): array
    {
        if (isset($data['category_id'])) {
            $cat = Database::one('SELECT id FROM categories WHERE id = ?', [(int) $data['category_id']]);
            if (!$cat) {
                throw HttpException::unprocessable('Categoria inválida.', ['category_id' => 'Categoria não existe.']);
            }
        }
        return $data;
    }

    protected function find(int $id): array
    {
        $row = Database::one($this->selectSql() . ' WHERE p.id = ?', [$id]);
        if (!$row) {
            throw HttpException::notFound();
        }
        return $row;
    }
}
