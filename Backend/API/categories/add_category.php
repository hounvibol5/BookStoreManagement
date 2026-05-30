<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';

requireMethod('POST');

$pdo = getPDO();
requireAdmin($pdo);

$input = getJsonInput();
$name = cleanString($input['name'] ?? null);
$description = cleanString($input['description'] ?? null);

if (!$name) {
    errorResponse('Category name is required', 422);
}

$stmt = $pdo->prepare(
    'INSERT INTO categories (name, description)
     VALUES (:name, :description)
     ON DUPLICATE KEY UPDATE
       description = COALESCE(VALUES(description), description),
       id = LAST_INSERT_ID(id)'
);
$stmt->execute([
    ':name' => $name,
    ':description' => $description,
]);

$id = (int) $pdo->lastInsertId();

$categoryStmt = $pdo->prepare(
    'SELECT id, name, description
     FROM categories
     WHERE id = :id
     LIMIT 1'
);
$categoryStmt->execute([':id' => $id]);
$category = $categoryStmt->fetch();

jsonResponse([
    'id' => (int) $category['id'],
    'name' => $category['name'],
    'description' => $category['description'],
], 201);
