<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

$pdo = getPDO();

$stmt = $pdo->query(
    'SELECT id, name, description
     FROM categories
     ORDER BY name ASC'
);

$categories = array_map(static function (array $category): array {
    return [
        'id' => (int) $category['id'],
        'name' => $category['name'],
        'description' => $category['description'],
    ];
}, $stmt->fetchAll());

jsonResponse($categories);
