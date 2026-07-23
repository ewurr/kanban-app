<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260717084352 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE workspace_user (workspace_id INT NOT NULL, user_id INT NOT NULL, PRIMARY KEY (workspace_id, user_id))');
        $this->addSql('CREATE INDEX IDX_C971A58B82D40A1F ON workspace_user (workspace_id)');
        $this->addSql('CREATE INDEX IDX_C971A58BA76ED395 ON workspace_user (user_id)');
        $this->addSql('ALTER TABLE workspace_user ADD CONSTRAINT FK_C971A58B82D40A1F FOREIGN KEY (workspace_id) REFERENCES workspace (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE workspace_user ADD CONSTRAINT FK_C971A58BA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE workspace_user DROP CONSTRAINT FK_C971A58B82D40A1F');
        $this->addSql('ALTER TABLE workspace_user DROP CONSTRAINT FK_C971A58BA76ED395');
        $this->addSql('DROP TABLE workspace_user');
    }
}
