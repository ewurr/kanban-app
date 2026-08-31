<?php

namespace App\Debug;

use Doctrine\DBAL\Driver;
use Doctrine\DBAL\Driver\Middleware;
use Doctrine\DBAL\Driver\Middleware\AbstractDriverMiddleware;
use Doctrine\DBAL\Driver\Middleware\AbstractConnectionMiddleware;
use Doctrine\DBAL\Driver\Middleware\AbstractStatementMiddleware;
use Doctrine\DBAL\Driver\Connection as ConnectionInterface;
use Doctrine\DBAL\Driver\Statement as StatementInterface;
use Doctrine\DBAL\Driver\Result;

/**
 * Doctrine DBAL middleware — her execute() çağrısını QueryCounter'a bildirir.
 * services.yaml'da doctrine.middleware olarak etiketlenmiş olması gerekiyor.
 */
class QueryCounterMiddleware implements Middleware
{
    public function __construct(private readonly QueryCounter $counter)
    {
    }

    public function wrap(Driver $driver): Driver
    {
        return new class ($driver, $this->counter) extends AbstractDriverMiddleware {
            public function __construct(Driver $driver, private readonly QueryCounter $counter)
            {
                parent::__construct($driver);
            }

            public function connect(array $params): ConnectionInterface
            {
                return new class (parent::connect($params), $this->counter) extends AbstractConnectionMiddleware {
                    public function __construct(ConnectionInterface $connection, private readonly QueryCounter $counter)
                    {
                        parent::__construct($connection);
                    }

                    public function prepare(string $sql): StatementInterface
                    {
                        return new class (parent::prepare($sql), $this->counter) extends AbstractStatementMiddleware {
                            public function __construct(StatementInterface $statement, private readonly QueryCounter $counter)
                            {
                                parent::__construct($statement);
                            }

                            public function execute(): Result
                            {
                                $this->counter->increment();
                                return parent::execute();
                            }
                        };
                    }

                    public function query(string $sql): Result
                    {
                        $this->counter->increment();
                        return parent::query($sql);
                    }
                };
            }
        };
    }
}