<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

final class LinksController extends CrudController
{
    protected string $table = 'links';
    protected array $rules = [
        'label' => 'required|string|max:120',
        'url' => 'required|string|max:500',
        'icon' => 'string|max:40',
        'is_primary' => 'bool',
        'sort_order' => 'int',
        'active' => 'bool',
    ];

    protected function present(array $row): array
    {
        $row = parent::present($row);
        $row['is_primary'] = (bool) $row['is_primary'];
        return $row;
    }
}
