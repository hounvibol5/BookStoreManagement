<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/books.php';

requireMethod('PUT');

$pdo = getPDO();
requireAdmin($pdo);
ensureBookAuthorImageColumn($pdo);

$id = cleanInt($_GET['id'] ?? null);

if ($id === null || $id < 1) {
    errorResponse('A valid book id is required', 422);
}

$book = validateBookPayload(getJsonInput(), true);

if (count($book) === 0) {
    errorResponse('No book fields were provided', 422);
}

$exists = $pdo->prepare('SELECT id FROM books WHERE id = :id LIMIT 1');
$exists->execute([':id' => $id]);

if (!$exists->fetch()) {
    errorResponse('Book not found', 404);
}

$sets = [];
$params = [':id' => $id];

foreach ($book as $field => $value) {
    $sets[] = "{$field} = :{$field}";
    $params[":{$field}"] = $value;
}

$sql = 'UPDATE books SET ' . implode(', ', $sets) . ' WHERE id = :id';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$bookStmt = $pdo->prepare(
    'SELECT books.*, categories.name AS category_name
     FROM books
     LEFT JOIN categories ON categories.id = books.category_id
     WHERE books.id = :id'
);
$bookStmt->execute([':id' => $id]);

jsonResponse(formatBook($bookStmt->fetch()));
