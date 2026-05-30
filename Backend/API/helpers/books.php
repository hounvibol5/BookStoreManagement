<?php
declare(strict_types=1);

function ensureBookAuthorImageColumn(PDO $pdo): void
{
    static $checked = false;

    if ($checked) {
        return;
    }

    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM books LIKE 'author_image'");

        if (!$stmt->fetch()) {
            $pdo->exec('ALTER TABLE books ADD COLUMN author_image VARCHAR(255) NULL AFTER author');
        }

        $checked = true;
    } catch (PDOException $exception) {
        errorResponse('Unable to prepare author image field', 500);
    }
}

function ensureBookRatingsTable(PDO $pdo): void
{
    static $checked = false;

    if ($checked) {
        return;
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS book_ratings (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            book_id INT UNSIGNED NOT NULL,
            user_id INT UNSIGNED NOT NULL,
            rating DECIMAL(2, 1) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_book_ratings_book_user (book_id, user_id),
            INDEX idx_book_ratings_user (user_id),
            INDEX idx_book_ratings_book (book_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $checked = true;
}

function syncBookRatingSummary(PDO $pdo, int $bookId): array
{
    $summaryStmt = $pdo->prepare(
        'SELECT COUNT(*) AS review_count, AVG(latest_ratings.rating) AS rating
         FROM (
             SELECT rated.rating
             FROM book_ratings rated
             INNER JOIN (
                 SELECT user_id, MAX(id) AS id
                 FROM book_ratings
                 WHERE book_id = :book_id
                 GROUP BY user_id
             ) latest_rating ON latest_rating.id = rated.id
         ) latest_ratings'
    );
    $summaryStmt->execute([':book_id' => $bookId]);
    $summary = $summaryStmt->fetch() ?: [];

    $reviewCount = max(0, (int) ($summary['review_count'] ?? 0));
    $rating = $reviewCount > 0 ? round((float) $summary['rating'], 1) : null;

    $updateStmt = $pdo->prepare(
        'UPDATE books
         SET rating = :rating, review_count = :review_count
         WHERE id = :id'
    );
    $updateStmt->execute([
        ':id' => $bookId,
        ':rating' => $rating,
        ':review_count' => $reviewCount,
    ]);

    return [
        'rating' => $rating,
        'review_count' => $reviewCount,
    ];
}

function bookRatingsTableExists(PDO $pdo): bool
{
    static $exists = null;

    if ($exists !== null) {
        return $exists;
    }

    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'book_ratings'");
        $exists = (bool) $stmt->fetch();
    } catch (PDOException $exception) {
        $exists = false;
    }

    return $exists;
}

function formatBook(array $book): array
{
    $rating = $book['summary_rating'] ?? $book['rating'] ?? null;
    $reviewCount = $book['summary_review_count'] ?? $book['review_count'] ?? 0;

    return [
        'id' => (int) $book['id'],
        'title' => $book['title'],
        'author' => $book['author'],
        'author_image' => $book['author_image'] ?? null,
        'category_id' => $book['category_id'] !== null ? (int) $book['category_id'] : null,
        'category_name' => $book['category_name'] ?? null,
        'price' => (float) $book['price'],
        'stock' => (int) $book['stock'],
        'description' => $book['description'] ?? null,
        'isbn' => $book['isbn'] ?? null,
        'published_year' => $book['published_year'] !== null ? (int) $book['published_year'] : null,
        'cover_image' => $book['cover_image'] ?? null,
        'rating' => $rating !== null ? (float) $rating : null,
        'review_count' => (int) $reviewCount,
        'user_rating' => array_key_exists('user_rating', $book) && $book['user_rating'] !== null
            ? (float) $book['user_rating']
            : null,
        'created_at' => $book['created_at'] ?? null,
        'updated_at' => $book['updated_at'] ?? null,
    ];
}

function validateBookPayload(array $input, bool $partial = false): array
{
    $book = [];

    if (!$partial || array_key_exists('title', $input)) {
        $book['title'] = cleanString($input['title'] ?? null);
        if (!$book['title']) {
            errorResponse('Title is required', 422);
        }
    }

    if (!$partial || array_key_exists('author', $input)) {
        $book['author'] = cleanString($input['author'] ?? null);
        if (!$book['author']) {
            errorResponse('Author is required', 422);
        }
    }

    if (!$partial || array_key_exists('author_image', $input)) {
        $book['author_image'] = cleanString($input['author_image'] ?? null);
    }

    if (!$partial || array_key_exists('price', $input)) {
        $book['price'] = cleanFloat($input['price'] ?? null);
        if ($book['price'] === null || $book['price'] < 0) {
            errorResponse('A valid price is required', 422);
        }
    }

    if (!$partial || array_key_exists('category_id', $input)) {
        $book['category_id'] = cleanInt($input['category_id'] ?? null);
    }

    if (!$partial || array_key_exists('stock', $input)) {
        $book['stock'] = cleanInt($input['stock'] ?? 0);
        if ($book['stock'] === null || $book['stock'] < 0) {
            $book['stock'] = 0;
        }
    }

    if (!$partial || array_key_exists('description', $input)) {
        $book['description'] = cleanString($input['description'] ?? null);
    }

    if (!$partial || array_key_exists('isbn', $input)) {
        $book['isbn'] = cleanString($input['isbn'] ?? null);
    }

    if (!$partial || array_key_exists('published_year', $input)) {
        $book['published_year'] = cleanInt($input['published_year'] ?? null);
    }

    if (!$partial || array_key_exists('cover_image', $input)) {
        $book['cover_image'] = cleanString($input['cover_image'] ?? null);
    }

    if (!$partial || array_key_exists('rating', $input)) {
        $rating = cleanFloat($input['rating'] ?? null);
        $book['rating'] = $rating === null ? null : max(0, min(5, $rating));
    }

    if (!$partial || array_key_exists('review_count', $input)) {
        $reviewCount = cleanInt($input['review_count'] ?? 0);
        $book['review_count'] = $reviewCount === null ? 0 : max(0, $reviewCount);
    }

    return $book;
}
