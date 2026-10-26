<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

final class BannersController extends CrudController
{
    protected string $table = 'banners';
    protected array $rules = [
        'title' => 'string|max:160',
        'image_url' => 'required|string|max:500',
        'link_url' => 'string|max:500',
        'sort_order' => 'int',
        'active' => 'bool',
    ];
}
