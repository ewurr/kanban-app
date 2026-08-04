<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260803130904 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // 1. Önce nullable olarak ekle
        $this->addSql('ALTER TABLE task ADD color VARCHAR(20) DEFAULT NULL');

        // 2. Mevcut task'lara, id'lerine göre deterministik bir renk ata (Task.tsx'teki mantıkla aynı)
        $colors = ['#FFD93D', '#FF9B9B', '#A8E6CF', '#C9C3FF', '#FFB6E1'];
        foreach ($colors as $index => $color) {
            $this->addSql(
                "UPDATE task SET color = '{$color}' WHERE MOD(id, 5) = {$index} AND color IS NULL"
            );
        }

        // 3. Şimdi NOT NULL kısıtını uygula
        $this->addSql('ALTER TABLE task ALTER COLUMN color SET NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE task DROP color');
    }
}
