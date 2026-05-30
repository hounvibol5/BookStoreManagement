<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getPDO();
requireAdmin($pdo);

$limit = min(getPositiveInt($_GET['limit'] ?? 5, 5), 20);

function fetchRows(PDO $pdo, string $sql, array $params = []): array
{
    $stmt = $pdo->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }

    $stmt->execute();

    return $stmt->fetchAll();
}

function fetchOne(PDO $pdo, string $sql): array
{
    $stmt = $pdo->query($sql);
    $row = $stmt ? $stmt->fetch() : false;

    return is_array($row) ? $row : [];
}

function getReportSummary(PDO $pdo): array
{
    try {
        return fetchOne($pdo, 'SELECT * FROM overview_summary_view LIMIT 1');
    } catch (PDOException $exception) {
        return fetchOne(
            $pdo,
            "SELECT
              (SELECT COUNT(*) FROM books) AS total_books,
              (SELECT COALESCE(SUM(stock), 0) FROM books) AS total_stock,
              (SELECT COALESCE(SUM(stock * price), 0) FROM books) AS inventory_value,
              (SELECT COUNT(*) FROM books WHERE stock > 0 AND stock <= 5) AS low_stock_books,
              (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers,
              (
                SELECT COUNT(DISTINCT orders.user_id)
                FROM orders
                INNER JOIN users ON users.id = orders.user_id
                WHERE status <> 'cancelled'
                  AND users.role = 'customer'
              ) AS active_customers,
              (SELECT COUNT(*) FROM orders) AS total_orders,
              (
                SELECT COALESCE(SUM(total_amount), 0)
                FROM orders
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  AND status <> 'cancelled'
              ) AS revenue_last_30_days,
              (
                SELECT COALESCE(SUM(total_amount), 0)
                FROM orders
                WHERE status <> 'cancelled'
              ) AS total_revenue"
        );
    }
}

function getTopCustomersForReports(PDO $pdo, int $limit): array
{
    try {
        $rows = fetchRows(
            $pdo,
            'SELECT *
             FROM customer_report_view
             ORDER BY total_spent DESC, last_order_at DESC, customer_id DESC
             LIMIT :limit',
            [':limit' => $limit]
        );
    } catch (PDOException $exception) {
        $rows = fetchRows(
            $pdo,
            "SELECT
                users.id AS customer_id,
                users.name,
                users.email,
                users.profile_picture,
                users.created_at,
                users.updated_at,
                COUNT(orders.id) AS order_count,
                COALESCE(
                  SUM(CASE WHEN orders.status <> 'cancelled' THEN orders.total_amount ELSE 0 END),
                  0
                ) AS total_spent,
                MAX(orders.created_at) AS last_order_at
             FROM users
             LEFT JOIN orders ON orders.user_id = users.id
             WHERE users.role = 'customer'
             GROUP BY
                users.id,
                users.name,
                users.email,
                users.profile_picture,
                users.created_at,
                users.updated_at
             ORDER BY total_spent DESC, last_order_at DESC, users.id DESC
             LIMIT :limit",
            [':limit' => $limit]
        );
    }

    return array_map(static function (array $customer): array {
        return [
            'id' => (int) $customer['customer_id'],
            'name' => $customer['name'],
            'email' => $customer['email'],
            'profilePicture' => $customer['profile_picture'] ?? null,
            'order_count' => (int) $customer['order_count'],
            'total_spent' => (float) $customer['total_spent'],
            'last_order_at' => $customer['last_order_at'],
            'created_at' => $customer['created_at'],
            'updated_at' => $customer['updated_at'],
        ];
    }, $rows);
}

function getDailySalesForReports(PDO $pdo): array
{
    try {
        $rows = fetchRows(
            $pdo,
            'SELECT *
             FROM daily_sales_report_view
             ORDER BY sales_date DESC
             LIMIT 9'
        );
    } catch (PDOException $exception) {
        $rows = fetchRows(
            $pdo,
            "SELECT
                DATE(orders.created_at) AS sales_date,
                COUNT(DISTINCT orders.id) AS order_count,
                COALESCE(SUM(order_items.quantity), 0) AS items_sold,
                COALESCE(SUM(orders.total_amount), 0) AS revenue
             FROM orders
             LEFT JOIN order_items ON order_items.order_id = orders.id
             WHERE orders.status <> 'cancelled'
             GROUP BY DATE(orders.created_at)
             ORDER BY sales_date DESC
             LIMIT 9"
        );
    }

    return array_map(static function (array $day): array {
        return [
            'date' => $day['sales_date'],
            'order_count' => (int) $day['order_count'],
            'items_sold' => (int) $day['items_sold'],
            'revenue' => (float) $day['revenue'],
        ];
    }, $rows);
}

$summary = getReportSummary($pdo);

jsonResponse([
    'summary' => [
        'books' => (int) ($summary['total_books'] ?? 0),
        'customers' => (int) ($summary['total_customers'] ?? 0),
        'activeCustomers' => (int) ($summary['active_customers'] ?? 0),
        'inventory' => (int) ($summary['total_stock'] ?? 0),
        'inventoryValue' => (float) ($summary['inventory_value'] ?? 0),
        'lowStock' => (int) ($summary['low_stock_books'] ?? 0),
        'orders' => (int) ($summary['total_orders'] ?? 0),
        'revenue' => (float) ($summary['revenue_last_30_days'] ?? $summary['total_revenue'] ?? 0),
        'totalRevenue' => (float) ($summary['total_revenue'] ?? 0),
    ],
    'customers' => getTopCustomersForReports($pdo, $limit),
    'dailySales' => getDailySalesForReports($pdo),
]);
