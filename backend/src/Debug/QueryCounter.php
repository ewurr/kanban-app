<?php

namespace App\Debug;

/**
 * Test/dev ortamında çalıştırılan SQL sorgu sayısını takip eder.
 * Doctrine middleware'i tarafından beslenir (QueryCounterMiddleware).
 *
 * Kullanım (test içinde):
 *   $counter = static::getContainer()->get(QueryCounter::class);
 *   $counter->reset();
 *   // ... bir istek yap ...
 *   $this->assertLessThan(10, $counter->getCount());
 */
class QueryCounter
{
    private int $count = 0;

    public function increment(): void
    {
        $this->count++;
    }

    public function reset(): void
    {
        $this->count = 0;
    }

    public function getCount(): int
    {
        return $this->count;
    }
}