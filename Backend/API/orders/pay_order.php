<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/orders.php';

requireMethod('POST');

$pdo = getPDO();
$user = requireAuth($pdo);
$input = getJsonInput();
$id = cleanInt($input['id'] ?? $_GET['id'] ?? null);

if ($id === null || $id < 1) {
    errorResponse('A valid order id is required', 422);
}

$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $id]);
$order = $stmt->fetch();

if (!$order) {
    errorResponse('Order not found', 404);
}

$isAdmin = ($user['role'] ?? '') === 'admin';

if (!$isAdmin && (int) $order['user_id'] !== (int) $user['id']) {
    errorResponse('Permission denied', 403);
}

if ($order['status'] === 'cancelled') {
    errorResponse('Cancelled orders cannot be paid', 422);
}

if ($order['status'] !== 'paid') {
    $updateStmt = $pdo->prepare(
        'UPDATE orders
         SET status = :status
         WHERE id = :id'
    );
    $updateStmt->execute([
        ':status' => 'paid',
        ':id' => $id,
    ]);
}

$stmt->execute([':id' => $id]);

jsonResponse(formatOrder($stmt->fetch(), getOrderItems($pdo, $id)));
