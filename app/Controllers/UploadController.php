<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Request;
use ImperioAcai\Upload;

final class UploadController
{
    public function store(Request $request): array
    {
        return ['url' => Upload::image('file')];
    }
}
