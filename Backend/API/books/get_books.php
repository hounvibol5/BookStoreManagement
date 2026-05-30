<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/books.php';

$pdo = getPDO();
$user = getAuthUser($pdo);

$page = getPositiveInt($_GET['page'] ?? 1, 1);
$limit = getPositiveInt($_GET['limit'] ?? 12, 12);
$limit = min($limit, 50);
$offset = ($page - 1) * $limit;
$search = cleanString($_GET['search'] ?? null);
$category = cleanInt($_GET['category'] ?? null);

$where = [];
$params = [];

if ($search !== null) {
    $where[] = '(books.title LIKE :search OR books.author LIKE :search OR books.isbn LIKE :search OR books.description LIKE :search)';
    $params[':search'] = '%' . $search . '%';
}

if ($category !== null && $category > 0) {
    $where[] = 'books.category_id = :category_id';
    $params[':category_id'] = $category;
}

$whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM books {$whereSql}");
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$total = (int) $countStmt->fetchColumn();

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

$sql = "SELECT books.*, categories.name AS category_name, {$ratingSummarySelect}, {$userRatingSelect}
        FROM books
        LEFT JOIN categories ON categories.id = books.category_id
        {$ratingSummaryJoin}
        {$userRatingJoin}
        {$whereSql}
        ORDER BY books.created_at DESC, books.id DESC
        LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
if ($selectUserRating) {
    $stmt->bindValue(':user_id', (int) $user['id'], PDO::PARAM_INT);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$books = array_map('formatBook', $stmt->fetchAll());
$totalPages = max(1, (int) ceil($total / $limit));

jsonResponse([
    'books' => $books,
    'page' => $page,
    'limit' => $limit,
    'total' => $total,
    'totalPages' => $totalPages,
]);
