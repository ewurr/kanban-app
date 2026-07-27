<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260726170503 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // 1. Önce nullable olarak ekle
        $this->addSql('ALTER TABLE task ADD created_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD name VARCHAR(100) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD surname VARCHAR(100) DEFAULT NULL');

        // 2. Mevcut satırlara geçici/varsayılan değer ata
        $this->addSql("UPDATE task SET created_at = NOW() WHERE created_at IS NULL");
        $this->addSql("UPDATE \"user\" SET name = 'İsim' WHERE name IS NULL");
        $this->addSql("UPDATE \"user\" SET surname = 'Soyisim' WHERE surname IS NULL");

        // 3. Şimdi NOT NULL kısıtını uygula
        $this->addSql('ALTER TABLE task ALTER COLUMN created_at SET NOT NULL');
        $this->addSql('ALTER TABLE "user" ALTER COLUMN name SET NOT NULL');
        $this->addSql('ALTER TABLE "user" ALTER COLUMN surname SET NOT NULL');

    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE task DROP created_at');
        $this->addSql('ALTER TABLE "user" DROP name');
        $this->addSql('ALTER TABLE "user" DROP surname');
    }
}
