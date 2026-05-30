<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getPDO();
requireAdmin($pdo);

function getDashboardNavStats(PDO $pdo): array
{
    try {
        $stmt = $pdo->query('SELECT * FROM dashboard_nav_view LIMIT 1');
        $stats = $stmt ? $stmt->fetch() : false;

        if (is_array($stats)) {
            return $stats;
        }
    } catch (PDOException $exception) {
        // Fall back to direct table queries when the view migration has not run yet.
    }

    $stmt = $pdo->query(
        "SELECT
          (SELECT COUNT(*) FROM books) AS book_count,
          (SELECT COUNT(*) FROM books WHERE stock = 0) AS out_of_stock_count,
          (SELECT COUNT(*) FROM books WHERE stock > 0 AND stock <= 5) AS low_stock_count,
          (SELECT COALESCE(SUM(stock), 0) FROM books) AS inventory_count,
          (SELECT COUNT(*) FROM orders) AS order_count,
          (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_order_count,
          (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customer_count,
          (SELECT COUNT(*) FROM orders WHERE status <> 'cancelled') AS report_order_count"
    );

    return $stmt ? ($stmt->fetch() ?: []) : [];
}

$stats = getDashboardNavStats($pdo);
$bookCount = (int) ($stats['book_count'] ?? 0);
$lowStockCount = (int) ($stats['low_stock_count'] ?? 0);
$outOfStockCount = (int) ($stats['out_of_stock_count'] ?? 0);
$healthyBooks = max(0, $bookCount - $lowStockCount - $outOfStockCount);
$catalogHealth = $bookCount > 0 ? (int) round(($healthyBooks / $bookCount) * 100) : 0;

jsonResponse([
    'catalogHealth' => $catalogHealth,
    'counts' => [
        'books' => $bookCount,
        'orders' => (int) ($stats['order_count'] ?? 0),
        'pendingOrders' => (int) ($stats['pending_order_count'] ?? 0),
        'customers' => (int) ($stats['customer_count'] ?? 0),
        'inventory' => (int) ($stats['inventory_count'] ?? 0),
        'reports' => (int) ($stats['report_order_count'] ?? 0),
        'lowStock' => $lowStockCount,
        'outOfStock' => $outOfStockCount,
    ],
]);
