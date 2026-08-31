<?php

namespace App\Filter;

/**
 * Task listeleme endpoint'lerine gelen filtre parametrelerini taşıyan DTO.
 *
 * Tüm alanlar nullable — null demek "bu filtreyi uygulama" demek.
 * Repository dinamik olarak sadece dolu olanları SQL'e ekler.
 *
 * Neden ayrı class:
 *   - Repository imzası temiz kalıyor (parametre patlaması yok)
 *   - Test yazması kolay — mock filtre oluşturmak tek satır
 *   - Yeni filtre eklerken sadece burası + repository dokunuyor
 */

class TaskFilter 
{
    public function __construct(

        /** User ID veya 'me' — 'me' controller'da current user ID'sine çevrilir */
        public readonly ?int $assignedTo = null,

        /** 'low' | 'medium' | 'high' — geçersiz değer null'a düşürülür */
        public readonly ?string $priority = null,

        /** Title veya description içinde arama (case-insensitive, LIKE %text%) */
        public readonly ?string $search = null,

    ) {}

    /**
     * Herhangi bir filtre aktif mi
     * Reoısitory dinamik SQL için optimize edebilir.
     */

    public function isEmpty(): bool
    {
        return $this->assignedTo === null
            && $this->priority === null
            && $this->search === null; 
    }
}