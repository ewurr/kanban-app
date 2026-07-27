<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260727120107 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE board DROP CONSTRAINT fk_58562b47166d1f9c');
        $this->addSql('ALTER TABLE board ADD CONSTRAINT FK_58562B47166D1F9C FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE "column" DROP CONSTRAINT fk_7d53877ee7ec5785');
        $this->addSql('ALTER TABLE "column" ADD CONSTRAINT FK_7D53877EE7EC5785 FOREIGN KEY (board_id) REFERENCES board (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE project DROP CONSTRAINT fk_2fb3d0ee82d40a1f');
        $this->addSql('ALTER TABLE project ADD CONSTRAINT FK_2FB3D0EE82D40A1F FOREIGN KEY (workspace_id) REFERENCES workspace (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE task DROP CONSTRAINT fk_527edb25be8e8ed5');
        $this->addSql('ALTER TABLE task ADD CONSTRAINT FK_527EDB25BE8E8ED5 FOREIGN KEY (column_id) REFERENCES "column" (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE task_assignment DROP CONSTRAINT fk_2cd60f158db60186');
        $this->addSql('ALTER TABLE task_assignment ADD CONSTRAINT FK_2CD60F158DB60186 FOREIGN KEY (task_id) REFERENCES task (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE workspace_member DROP CONSTRAINT fk_40242bd082d40a1f');
        $this->addSql('ALTER TABLE workspace_member ADD CONSTRAINT FK_40242BD082D40A1F FOREIGN KEY (workspace_id) REFERENCES workspace (id) ON DELETE CASCADE NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE board DROP CONSTRAINT FK_58562B47166D1F9C');
        $this->addSql('ALTER TABLE board ADD CONSTRAINT fk_58562b47166d1f9c FOREIGN KEY (project_id) REFERENCES project (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE "column" DROP CONSTRAINT FK_7D53877EE7EC5785');
        $this->addSql('ALTER TABLE "column" ADD CONSTRAINT fk_7d53877ee7ec5785 FOREIGN KEY (board_id) REFERENCES board (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE project DROP CONSTRAINT FK_2FB3D0EE82D40A1F');
        $this->addSql('ALTER TABLE project ADD CONSTRAINT fk_2fb3d0ee82d40a1f FOREIGN KEY (workspace_id) REFERENCES workspace (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE task DROP CONSTRAINT FK_527EDB25BE8E8ED5');
        $this->addSql('ALTER TABLE task ADD CONSTRAINT fk_527edb25be8e8ed5 FOREIGN KEY (column_id) REFERENCES "column" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE task_assignment DROP CONSTRAINT FK_2CD60F158DB60186');
        $this->addSql('ALTER TABLE task_assignment ADD CONSTRAINT fk_2cd60f158db60186 FOREIGN KEY (task_id) REFERENCES task (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE workspace_member DROP CONSTRAINT FK_40242BD082D40A1F');
        $this->addSql('ALTER TABLE workspace_member ADD CONSTRAINT fk_40242bd082d40a1f FOREIGN KEY (workspace_id) REFERENCES workspace (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
