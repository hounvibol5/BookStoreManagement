<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';

requireMethod('DELETE');

$pdo = getPDO();
requireAdmin($pdo);

$id = cleanInt($_GET['id'] ?? null);

if ($id === null || $id < 1) {
    errorResponse('A valid book id is required', 422);
}

try {
    $stmt = $pdo->prepare('DELETE FROM books WHERE id = :id');
    $stmt->execute([':id' => $id]);
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') {
        errorResponse('This book cannot be deleted because it is used in existing orders', 409);
    }

    errorResponse('Failed to delete book', 500, $exception->getMessage());
}

if ($stmt->rowCount() === 0) {
    errorResponse('Book not found', 404);
}

jsonResponse(['message' => 'Book deleted']);
