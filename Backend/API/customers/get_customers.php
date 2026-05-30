<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';

$pdo = getPDO();
requireAdmin($pdo);

$page = getPositiveInt($_GET['page'] ?? 1, 1);
$limit = min(getPositiveInt($_GET['limit'] ?? 20, 20), 50);
$offset = ($page - 1) * $limit;
$search = cleanString($_GET['search'] ?? null);

$where = ["users.role = 'customer'"];
$params = [];

if ($search !== null) {
    $where[] = '(users.name LIKE :search OR users.email LIKE :search)';
    $params[':search'] = '%' . $search . '%';
}

$whereSql = 'WHERE ' . implode(' AND ', $where);

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM users {$whereSql}");

foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}

$countStmt->execute();
$total = (int) $countStmt->fetchColumn();

$summaryStmt = $pdo->prepare(
    "SELECT
        COUNT(DISTINCT users.id) AS total_customers,
        COUNT(DISTINCT CASE WHEN orders.id IS NOT NULL THEN users.id END) AS active_customers,
        COALESCE(
            SUM(
                CASE
                    WHEN orders.status <> 'cancelled' THEN orders.total_amount
                    ELSE 0
                END
            ),
            0
        ) AS total_spent
     FROM users
     LEFT JOIN orders ON orders.user_id = users.id
     {$whereSql}"
);

foreach ($params as $key => $value) {
    $summaryStmt->bindValue($key, $value);
}

$summaryStmt->execute();
$summary = $summaryStmt->fetch() ?: [
    'total_customers' => 0,
    'active_customers' => 0,
    'total_spent' => 0,
];

$stmt = $pdo->prepare(
    "SELECT
        users.id,
        users.name,
        users.email,
        users.role,
        users.created_at,
        users.updated_at,
        COUNT(orders.id) AS order_count,
        COALESCE(
            SUM(
                CASE
                    WHEN orders.status <> 'cancelled' THEN orders.total_amount
                    ELSE 0
                END
            ),
            0
        ) AS total_spent,
        MAX(orders.created_at) AS last_order_at
     FROM users
     LEFT JOIN orders ON orders.user_id = users.id
     {$whereSql}
     GROUP BY
        users.id,
        users.name,
        users.email,
        users.role,
        users.created_at,
        users.updated_at
     ORDER BY last_order_at DESC, users.created_at DESC, users.id DESC
     LIMIT :limit OFFSET :offset"
);

foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}

$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$customers = array_map(static function (array $customer): array {
    return [
        'id' => (int) $customer['id'],
        'name' => $customer['name'],
        'email' => $customer['email'],
        'role' => $customer['role'],
        'order_count' => (int) $customer['order_count'],
        'total_spent' => (float) $customer['total_spent'],
        'last_order_at' => $customer['last_order_at'],
        'created_at' => $customer['created_at'],
        'updated_at' => $customer['updated_at'],
    ];
}, $stmt->fetchAll());

jsonResponse([
    'customers' => $customers,
    'page' => $page,
    'limit' => $limit,
    'total' => $total,
    'totalPages' => max(1, (int) ceil($total / $limit)),
    'summary' => [
        'total_customers' => (int) $summary['total_customers'],
        'active_customers' => (int) $summary['active_customers'],
        'total_spent' => (float) $summary['total_spent'],
    ],
]);
