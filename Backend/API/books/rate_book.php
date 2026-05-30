<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/books.php';

requireMethod('POST');

$pdo = getPDO();
$user = requireAuth($pdo);
$input = getJsonInput();
$id = cleanInt($_GET['id'] ?? ($input['book_id'] ?? null));
$rating = cleanFloat($input['rating'] ?? null);

if (($user['role'] ?? '') !== 'customer') {
    errorResponse('Only customers can rate books', 403);
}

if ($id === null || $id < 1) {
    errorResponse('A valid book id is required', 422);
}

if ($rating === null || $rating < 1 || $rating > 5) {
    errorResponse('Rating must be between 1 and 5', 422);
}

try {
    ensureBookRatingsTable($pdo);

    $pdo->beginTransaction();

    $bookStmt = $pdo->prepare('SELECT * FROM books WHERE id = :id LIMIT 1 FOR UPDATE');
    $bookStmt->execute([':id' => $id]);
    $book = $bookStmt->fetch();

    if (!$book) {
        throw new RuntimeException('Book not found', 404);
    }

    $existingStmt = $pdo->prepare(
        'SELECT id
         FROM book_ratings
         WHERE book_id = :book_id AND user_id = :user_id
         ORDER BY updated_at DESC, id DESC
         LIMIT 1
         FOR UPDATE'
    );
    $existingStmt->execute([
        ':book_id' => $id,
        ':user_id' => (int) $user['id'],
    ]);
    $existingRatingId = $existingStmt->fetchColumn();

    if ($existingRatingId !== false) {
        $saveRatingStmt = $pdo->prepare(
            'UPDATE book_ratings
             SET rating = :rating
             WHERE id = :id'
        );
        $saveRatingStmt->execute([
            ':id' => (int) $existingRatingId,
            ':rating' => round($rating, 1),
        ]);
    } else {
        $saveRatingStmt = $pdo->prepare(
            'INSERT INTO book_ratings (book_id, user_id, rating)
             VALUES (:book_id, :user_id, :rating)'
        );
        $saveRatingStmt->execute([
            ':book_id' => $id,
            ':user_id' => (int) $user['id'],
            ':rating' => round($rating, 1),
        ]);
    }

    syncBookRatingSummary($pdo, $id);

    $updatedStmt = $pdo->prepare(
        'SELECT books.*, categories.name AS category_name
         FROM books
         LEFT JOIN categories ON categories.id = books.category_id
         WHERE books.id = :id
         LIMIT 1'
    );
    $updatedStmt->execute([':id' => $id]);

    $pdo->commit();

    $payload = formatBook($updatedStmt->fetch());
    $payload['user_rating'] = round($rating, 1);

    jsonResponse($payload);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    errorResponse('Failed to rate book', 500, $exception->getMessage());
} catch (RuntimeException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $code = (int) $exception->getCode();
    $status = $code >= 400 && $code < 500 ? $code : 422;
    errorResponse($exception->getMessage(), $status);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    errorResponse('Failed to rate book', 500, $exception->getMessage());
}
