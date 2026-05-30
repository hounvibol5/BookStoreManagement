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
$items = $input['items'] ?? [];

if (!is_array($items) || count($items) === 0) {
    errorResponse('Order items are required', 422);
}

$requestedItems = [];

foreach ($items as $item) {
    if (!is_array($item)) {
        errorResponse('Invalid order item', 422);
    }

    $bookId = cleanInt($item['book_id'] ?? $item['id'] ?? null);
    $quantity = cleanInt($item['quantity'] ?? $item['qty'] ?? null);

    if ($bookId === null || $bookId < 1 || $quantity === null || $quantity < 1) {
        errorResponse('Each item requires a valid book id and quantity', 422);
    }

    $requestedItems[$bookId] = ($requestedItems[$bookId] ?? 0) + $quantity;
}

try {
    $pdo->beginTransaction();

    $bookStmt = $pdo->prepare(
        'SELECT id, title, author, price, stock
         FROM books
         WHERE id = :id
         FOR UPDATE'
    );
    $insertItemStmt = $pdo->prepare(
        'INSERT INTO order_items
            (order_id, book_id, title, author, quantity, unit_price, line_total)
         VALUES
            (:order_id, :book_id, :title, :author, :quantity, :unit_price, :line_total)'
    );
    $stockStmt = $pdo->prepare(
        'UPDATE books
         SET stock = stock - :quantity
         WHERE id = :id'
    );

    $orderItems = [];
    $total = 0.0;

    foreach ($requestedItems as $bookId => $quantity) {
        $bookStmt->execute([':id' => $bookId]);
        $book = $bookStmt->fetch();

        if (!$book) {
            throw new RuntimeException("Book {$bookId} was not found");
        }

        if ((int) $book['stock'] < $quantity) {
            throw new RuntimeException("Not enough stock for {$book['title']}");
        }

        $unitPrice = (float) $book['price'];
        $lineTotal = $unitPrice * $quantity;
        $total += $lineTotal;

        $orderItems[] = [
            'book_id' => (int) $book['id'],
            'title' => $book['title'],
            'author' => $book['author'],
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'line_total' => $lineTotal,
        ];
    }

    $orderStmt = $pdo->prepare(
        'INSERT INTO orders
            (user_id, status, total_amount, customer_name, customer_email)
         VALUES
            (:user_id, :status, :total_amount, :customer_name, :customer_email)'
    );
    $orderStmt->execute([
        ':user_id' => (int) $user['id'],
        ':status' => 'pending',
        ':total_amount' => $total,
        ':customer_name' => $user['name'],
        ':customer_email' => $user['email'],
    ]);

    $orderId = (int) $pdo->lastInsertId();

    foreach ($orderItems as $item) {
        $insertItemStmt->execute([
            ':order_id' => $orderId,
            ':book_id' => $item['book_id'],
            ':title' => $item['title'],
            ':author' => $item['author'],
            ':quantity' => $item['quantity'],
            ':unit_price' => $item['unit_price'],
            ':line_total' => $item['line_total'],
        ]);
        $stockStmt->execute([
            ':id' => $item['book_id'],
            ':quantity' => $item['quantity'],
        ]);
    }

    $pdo->commit();

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id');
    $stmt->execute([':id' => $orderId]);

    jsonResponse(formatOrder($stmt->fetch(), getOrderItems($pdo, $orderId)), 201);
} catch (RuntimeException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    errorResponse($exception->getMessage(), 422);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    errorResponse('Failed to create order', 500, $exception->getMessage());
}
