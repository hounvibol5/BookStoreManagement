<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/books.php';

$pdo = getPDO();
requireAdmin($pdo);

$threshold = min(getPositiveInt($_GET['threshold'] ?? 5, 5), 100);
$limit = min(getPositiveInt($_GET['limit'] ?? 8, 8), 30);

function formatInventoryBook(array $book): array
{
    $formatted = formatBook($book);
    $formatted['stock_value'] = (float) ($book['stock_value'] ?? 0);
    $formatted['sold_last_30_days'] = (int) ($book['sold_last_30_days'] ?? 0);

    return $formatted;
}

$summaryStmt = $pdo->prepare(
    'SELECT
        COUNT(*) AS total_books,
        COALESCE(SUM(stock), 0) AS total_stock,
        COALESCE(SUM(stock * price), 0) AS total_value,
        COALESCE(AVG(stock), 0) AS average_stock,
        COALESCE(SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_count,
        COALESCE(SUM(CASE WHEN stock > 0 AND stock <= :low_threshold THEN 1 ELSE 0 END), 0) AS low_stock_count,
        COALESCE(SUM(CASE WHEN stock > :healthy_threshold THEN 1 ELSE 0 END), 0) AS healthy_stock_count
     FROM books'
);
$summaryStmt->bindValue(':low_threshold', $threshold, PDO::PARAM_INT);
$summaryStmt->bindValue(':healthy_threshold', $threshold, PDO::PARAM_INT);
$summaryStmt->execute();
$summary = $summaryStmt->fetch() ?: [];

$categoryStmt = $pdo->prepare(
    'SELECT
        categories.id AS category_id,
        COALESCE(categories.name, \'Uncategorized\') AS category_name,
        COUNT(books.id) AS book_count,
        COALESCE(SUM(books.stock), 0) AS total_stock,
        COALESCE(SUM(books.stock * books.price), 0) AS stock_value,
        COALESCE(SUM(CASE WHEN books.stock > 0 AND books.stock <= :threshold THEN 1 ELSE 0 END), 0) AS low_stock_count
     FROM books
     LEFT JOIN categories ON categories.id = books.category_id
     GROUP BY categories.id, categories.name
     ORDER BY total_stock DESC, category_name ASC'
);
$categoryStmt->bindValue(':threshold', $threshold, PDO::PARAM_INT);
$categoryStmt->execute();

$categoryStock = array_map(static function (array $category): array {
    return [
        'category_id' => $category['category_id'] !== null ? (int) $category['category_id'] : null,
        'category_name' => $category['category_name'],
        'book_count' => (int) $category['book_count'],
        'total_stock' => (int) $category['total_stock'],
        'stock_value' => (float) $category['stock_value'],
        'low_stock_count' => (int) $category['low_stock_count'],
    ];
}, $categoryStmt->fetchAll());

$lowStockStmt = $pdo->prepare(
    'SELECT
        books.*,
        categories.name AS category_name,
        COALESCE(recent_sales.sold_last_30_days, 0) AS sold_last_30_days,
        books.stock * books.price AS stock_value
     FROM books
     LEFT JOIN categories ON categories.id = books.category_id
     LEFT JOIN (
        SELECT
            order_items.book_id,
            SUM(order_items.quantity) AS sold_last_30_days
        FROM order_items
        INNER JOIN orders ON orders.id = order_items.order_id
        WHERE orders.status <> \'cancelled\'
          AND orders.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY order_items.book_id
     ) recent_sales ON recent_sales.book_id = books.id
     WHERE books.stock <= :threshold
     ORDER BY books.stock ASC, sold_last_30_days DESC, books.title ASC
     LIMIT :limit'
);
$lowStockStmt->bindValue(':threshold', $threshold, PDO::PARAM_INT);
$lowStockStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$lowStockStmt->execute();
$lowStockBooks = array_map('formatInventoryBook', $lowStockStmt->fetchAll());

$fastMoverStmt = $pdo->prepare(
    'SELECT
        books.*,
        categories.name AS category_name,
        recent_sales.sold_last_30_days,
        books.stock * books.price AS stock_value
     FROM (
        SELECT
            order_items.book_id,
            SUM(order_items.quantity) AS sold_last_30_days
        FROM order_items
        INNER JOIN orders ON orders.id = order_items.order_id
        WHERE orders.status <> \'cancelled\'
          AND orders.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY order_items.book_id
     ) recent_sales
     INNER JOIN books ON books.id = recent_sales.book_id
     LEFT JOIN categories ON categories.id = books.category_id
     ORDER BY recent_sales.sold_last_30_days DESC, books.stock ASC
     LIMIT :limit'
);
$fastMoverStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$fastMoverStmt->execute();
$fastMovers = array_map('formatInventoryBook', $fastMoverStmt->fetchAll());

jsonResponse([
    'summary' => [
        'total_books' => (int) ($summary['total_books'] ?? 0),
        'total_stock' => (int) ($summary['total_stock'] ?? 0),
        'total_value' => (float) ($summary['total_value'] ?? 0),
        'average_stock' => (float) ($summary['average_stock'] ?? 0),
        'out_of_stock_count' => (int) ($summary['out_of_stock_count'] ?? 0),
        'low_stock_count' => (int) ($summary['low_stock_count'] ?? 0),
        'healthy_stock_count' => (int) ($summary['healthy_stock_count'] ?? 0),
        'low_stock_threshold' => $threshold,
    ],
    'low_stock_books' => $lowStockBooks,
    'category_stock' => $categoryStock,
    'fast_movers' => $fastMovers,
]);
