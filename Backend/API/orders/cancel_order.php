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

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1 FOR UPDATE');
    $stmt->execute([':id' => $id]);
    $order = $stmt->fetch();

    if (!$order) {
        throw new RuntimeException('Order not found', 404);
    }

    $isAdmin = ($user['role'] ?? '') === 'admin';

    if (!$isAdmin && (int) $order['user_id'] !== (int) $user['id']) {
        throw new RuntimeException('Permission denied', 403);
    }

    if ($order['status'] === 'paid') {
        throw new RuntimeException('Paid orders cannot be cancelled', 422);
    }

    $items = getOrderItems($pdo, $id);

    if ($order['status'] !== 'cancelled') {
        $stockStmt = $pdo->prepare(
            'UPDATE books
             SET stock = stock + :quantity
             WHERE id = :id'
        );

        foreach ($items as $item) {
            $stockStmt->execute([
                ':quantity' => (int) $item['quantity'],
                ':id' => (int) $item['book_id'],
            ]);
        }

        $updateStmt = $pdo->prepare(
            'UPDATE orders
             SET status = :status
             WHERE id = :id'
        );
        $updateStmt->execute([
            ':status' => 'cancelled',
            ':id' => $id,
        ]);
    }

    $stmt->execute([':id' => $id]);
    $cancelledOrder = $stmt->fetch();

    $pdo->commit();

    jsonResponse(formatOrder($cancelledOrder, $items));
} catch (RuntimeException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $status = $exception->getCode();
    errorResponse($exception->getMessage(), $status >= 400 ? $status : 422);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    errorResponse('Failed to cancel order', 500, $exception->getMessage());
}
