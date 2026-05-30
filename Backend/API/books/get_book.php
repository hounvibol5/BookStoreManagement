<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/books.php';

$pdo = getPDO();
$user = getAuthUser($pdo);
$id = cleanInt($_GET['id'] ?? null);

if ($id === null || $id < 1) {
    errorResponse('A valid book id is required', 422);
}

$hasRatingsTable = bookRatingsTableExists($pdo);
$selectUserRating = $user && $hasRatingsTable;
$userRatingSelect = $selectUserRating ? 'user_book_rating.rating AS user_rating' : 'NULL AS user_rating';
$userRatingJoin = $selectUserRating
    ? 'LEFT JOIN (
           SELECT rated.book_id, rated.rating
           FROM book_ratings rated
           INNER JOIN (
               SELECT book_id, MAX(id) AS id
               FROM book_ratings
               WHERE user_id = :user_id
               GROUP BY book_id
           ) latest_user_rating ON latest_user_rating.id = rated.id
       ) user_book_rating ON user_book_rating.book_id = books.id'
    : '';
$ratingSummarySelect = $hasRatingsTable
    ? 'rating_summary.rating AS summary_rating, COALESCE(rating_summary.review_count, 0) AS summary_review_count'
    : 'NULL AS summary_rating, books.review_count AS summary_review_count';
$ratingSummaryJoin = $hasRatingsTable
    ? 'LEFT JOIN (
           SELECT latest_rating.book_id, ROUND(AVG(rated.rating), 1) AS rating, COUNT(*) AS review_count
           FROM book_ratings rated
           INNER JOIN (
               SELECT book_id, user_id, MAX(id) AS id
               FROM book_ratings
               GROUP BY book_id, user_id
           ) latest_rating ON latest_rating.id = rated.id
           GROUP BY latest_rating.book_id
       ) rating_summary ON rating_summary.book_id = books.id'
    : '';

$stmt = $pdo->prepare(
    "SELECT books.*, categories.name AS category_name, {$ratingSummarySelect}, {$userRatingSelect}
     FROM books
     LEFT JOIN categories ON categories.id = books.category_id
     {$ratingSummaryJoin}
     {$userRatingJoin}
     WHERE books.id = :id
     LIMIT 1"
);

$params = [':id' => $id];

if ($selectUserRating) {
    $params[':user_id'] = (int) $user['id'];
}

$stmt->execute($params);
$book = $stmt->fetch();

if (!$book) {
    errorResponse('Book not found', 404);
}

jsonResponse(formatBook($book));
