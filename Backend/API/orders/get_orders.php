<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/orders.php';

$pdo = getPDO();
$user = requireAuth($pdo);
$page = getPositiveInt($_GET['page'] ?? 1, 1);
$limit = min(getPositiveInt($_GET['limit'] ?? 20, 20), 50);
$offset = ($page - 1) * $limit;
$isAdmin = ($user['role'] ?? '') === 'admin';

if ($isAdmin) {
    $countStmt = $pdo->query('SELECT COUNT(*) FROM orders');
    $total = (int) $countStmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT *
         FROM orders
         ORDER BY created_at DESC, id DESC
         LIMIT :limit OFFSET :offset'
    );
} else {
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM orders WHERE user_id = :user_id');
    $countStmt->execute([':user_id' => (int) $user['id']]);
    $total = (int) $countStmt->fetchColumn();

    $stmt = $pdo->prepare(
        'SELECT *
         FROM orders
         WHERE user_id = :user_id
         ORDER BY created_at DESC, id DESC
         LIMIT :limit OFFSET :offset'
    );
    $stmt->bindValue(':user_id', (int) $user['id'], PDO::PARAM_INT);
}

$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$orders = [];

foreach ($stmt->fetchAll() as $order) {
    $orders[] = formatOrder($order, getOrderItems($pdo, (int) $order['id']));
}

jsonResponse([
    'orders' => $orders,
    'page' => $page,
    'limit' => $limit,
    'total' => $total,
    'totalPages' => max(1, (int) ceil($total / $limit)),
]);
