<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getPDO();
requireAdmin($pdo);

$limit = min(getPositiveInt($_GET['limit'] ?? 5, 5), 20);

function getTableRows(PDO $pdo, string $sql, array $params = []): array
{
    $stmt = $pdo->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }

    $stmt->execute();

    return $stmt->fetchAll();
}

function getSingleRow(PDO $pdo, string $sql): array
{
    $stmt = $pdo->query($sql);
    $row = $stmt ? $stmt->fetch() : false;

    return is_array($row) ? $row : [];
}

function getOverviewSummary(PDO $pdo): array
{
    try {
        return getSingleRow($pdo, 'SELECT * FROM overview_summary_view LIMIT 1');
    } catch (PDOException $exception) {
        return getSingleRow(
            $pdo,
            "SELECT
              (SELECT COUNT(*) FROM books) AS total_books,
              (SELECT COALESCE(SUM(stock), 0) FROM books) AS total_stock,
              (SELECT COALESCE(SUM(stock * price), 0) FROM books) AS inventory_value,
              (SELECT COUNT(*) FROM books WHERE stock = 0) AS out_of_stock_books,
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
                WHERE status <> 'cancelled'
              ) AS total_revenue,
              (
                SELECT COALESCE(SUM(total_amount), 0)
                FROM orders
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  AND status <> 'cancelled'
              ) AS revenue_last_30_days,
              (
                SELECT COUNT(*)
                FROM orders
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
              ) AS orders_last_30_days"
        );
    }
}

function getRecentOrders(PDO $pdo, int $limit): array
{
    try {
        $rows = getTableRows(
            $pdo,
            'SELECT *
             FROM orders_report_view
             ORDER BY created_at DESC, order_id DESC
             LIMIT :limit',
            [':limit' => $limit]
        );
    } catch (PDOException $exception) {
        $rows = getTableRows(
            $pdo,
            'SELECT
                orders.id AS order_id,
                orders.user_id,
                orders.status,
                orders.total_amount,
                orders.customer_name,
                orders.customer_email,
                COUNT(order_items.id) AS item_count,
                COALESCE(SUM(order_items.quantity), 0) AS quantity_count,
                orders.created_at,
                orders.updated_at
             FROM orders
             LEFT JOIN order_items ON order_items.order_id = orders.id
             GROUP BY
                orders.id,
                orders.user_id,
                orders.status,
                orders.total_amount,
                orders.customer_name,
                orders.customer_email,
                orders.created_at,
                orders.updated_at
             ORDER BY orders.created_at DESC, orders.id DESC
             LIMIT :limit',
            [':limit' => $limit]
        );
    }

    return array_map(static function (array $order): array {
        return [
            'id' => (int) $order['order_id'],
            'user_id' => (int) $order['user_id'],
            'status' => $order['status'],
            'total_amount' => (float) $order['total_amount'],
            'customer_name' => $order['customer_name'],
            'customer_email' => $order['customer_email'],
            'item_count' => (int) $order['item_count'],
            'quantity_count' => (int) $order['quantity_count'],
            'created_at' => $order['created_at'],
            'updated_at' => $order['updated_at'],
        ];
    }, $rows);
}

function getTopCustomers(PDO $pdo, int $limit): array
{
    try {
        $rows = getTableRows(
            $pdo,
            'SELECT *
             FROM customer_report_view
             ORDER BY last_order_at DESC, created_at DESC, customer_id DESC
             LIMIT :limit',
            [':limit' => $limit]
        );
    } catch (PDOException $exception) {
        $rows = getTableRows(
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
             ORDER BY last_order_at DESC, users.created_at DESC, users.id DESC
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

function getFastMovers(PDO $pdo, int $limit): array
{
    try {
        $rows = getTableRows(
            $pdo,
            'SELECT *
             FROM inventory_report_view
             WHERE sold_last_30_days > 0
             ORDER BY sold_last_30_days DESC, stock ASC, title ASC
             LIMIT :limit',
            [':limit' => $limit]
        );
    } catch (PDOException $exception) {
        $rows = getTableRows(
            $pdo,
            "SELECT
                books.id AS book_id,
                books.title,
                books.author,
                books.category_id,
                COALESCE(categories.name, 'Uncategorized') AS category_name,
                books.price,
                books.stock,
                books.stock * books.price AS stock_value,
                books.rating,
                books.review_count,
                COALESCE(SUM(
                  CASE
                    WHEN orders.status <> 'cancelled'
                     AND orders.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    THEN order_items.quantity
                    ELSE 0
                  END
                ), 0) AS sold_last_30_days,
                books.created_at,
                books.updated_at
             FROM books
             LEFT JOIN categories ON categories.id = books.category_id
             LEFT JOIN order_items ON order_items.book_id = books.id
             LEFT JOIN orders ON orders.id = order_items.order_id
             GROUP BY
                books.id,
                books.title,
                books.author,
                books.category_id,
                categories.name,
                books.price,
                books.stock,
                books.rating,
                books.review_count,
                books.created_at,
                books.updated_at
             HAVING sold_last_30_days > 0
             ORDER BY sold_last_30_days DESC, books.stock ASC, books.title ASC
             LIMIT :limit",
            [':limit' => $limit]
        );
    }

    return array_map(static function (array $book): array {
        return [
            'id' => (int) $book['book_id'],
            'title' => $book['title'],
            'author' => $book['author'],
            'category_id' => $book['category_id'] !== null ? (int) $book['category_id'] : null,
            'category_name' => $book['category_name'],
            'price' => (float) $book['price'],
            'stock' => (int) $book['stock'],
            'stock_value' => (float) $book['stock_value'],
            'rating' => $book['rating'] !== null ? (float) $book['rating'] : null,
            'review_count' => (int) ($book['review_count'] ?? 0),
            'sold_last_30_days' => (int) $book['sold_last_30_days'],
            'created_at' => $book['created_at'],
            'updated_at' => $book['updated_at'],
        ];
    }, $rows);
}

function getDailySales(PDO $pdo): array
{
    try {
        $rows = getTableRows(
            $pdo,
            'SELECT *
             FROM daily_sales_report_view
             ORDER BY sales_date DESC
             LIMIT 9'
        );
    } catch (PDOException $exception) {
        $rows = getTableRows(
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

$summary = getOverviewSummary($pdo);
$totalBooks = (int) ($summary['total_books'] ?? 0);
$lowStock = (int) ($summary['low_stock_books'] ?? 0);
$outOfStock = (int) ($summary['out_of_stock_books'] ?? 0);
$healthyStock = max(0, $totalBooks - $lowStock - $outOfStock);

jsonResponse([
    'summary' => [
        'books' => $totalBooks,
        'inventory' => (int) ($summary['total_stock'] ?? 0),
        'inventoryValue' => (float) ($summary['inventory_value'] ?? 0),
        'lowStock' => $lowStock,
        'outOfStock' => $outOfStock,
        'healthyStock' => $healthyStock,
        'orders' => (int) ($summary['total_orders'] ?? 0),
        'revenue' => (float) ($summary['revenue_last_30_days'] ?? $summary['total_revenue'] ?? 0),
        'totalRevenue' => (float) ($summary['total_revenue'] ?? 0),
        'customers' => (int) ($summary['total_customers'] ?? 0),
        'activeCustomers' => (int) ($summary['active_customers'] ?? 0),
        'ordersLast30Days' => (int) ($summary['orders_last_30_days'] ?? 0),
    ],
    'orders' => getRecentOrders($pdo, $limit),
    'customers' => getTopCustomers($pdo, $limit),
    'inventoryReport' => [
        'fast_movers' => getFastMovers($pdo, $limit),
    ],
    'dailySales' => getDailySales($pdo),
]);
