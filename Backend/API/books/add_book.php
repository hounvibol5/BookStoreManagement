<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/books.php';

requireMethod('POST');

$pdo = getPDO();
requireAdmin($pdo);
ensureBookAuthorImageColumn($pdo);

$book = validateBookPayload(getJsonInput());

$stmt = $pdo->prepare(
    'INSERT INTO books
        (title, author, author_image, category_id, price, stock, description, isbn, published_year, cover_image, rating, review_count)
     VALUES
        (:title, :author, :author_image, :category_id, :price, :stock, :description, :isbn, :published_year, :cover_image, :rating, :review_count)'
);

$stmt->execute([
    ':title' => $book['title'],
    ':author' => $book['author'],
    ':author_image' => $book['author_image'],
    ':category_id' => $book['category_id'],
    ':price' => $book['price'],
    ':stock' => $book['stock'],
    ':description' => $book['description'],
    ':isbn' => $book['isbn'],
    ':published_year' => $book['published_year'],
    ':cover_image' => $book['cover_image'],
    ':rating' => $book['rating'],
    ':review_count' => $book['review_count'],
]);

$id = (int) $pdo->lastInsertId();

$bookStmt = $pdo->prepare(
    'SELECT books.*, categories.name AS category_name
     FROM books
     LEFT JOIN categories ON categories.id = books.category_id
     WHERE books.id = :id'
);
$bookStmt->execute([':id' => $id]);

jsonResponse(formatBook($bookStmt->fetch()), 201);
