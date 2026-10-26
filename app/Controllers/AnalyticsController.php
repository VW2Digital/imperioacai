<?php
declare(strict_types=1);

namespace ImperioAcai\Controllers;

use ImperioAcai\Analytics;
use ImperioAcai\Request;

final class AnalyticsController
{
    public function track(Request $request): array
    {
        Analytics::track($request);
        return ['ok' => true];
    }

    public function insights(Request $request): array
    {
        return Analytics::report((string) $request->query('range', '7d'));
    }
}
