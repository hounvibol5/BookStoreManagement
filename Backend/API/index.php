<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/helpers/response.php';

jsonResponse([
    'name' => 'BookStore Management API',
    'status' => 'ok',
]);
