<?php
declare(strict_types=1);

function formatOrder(array $order, array $items = []): array
{
    return [
        'id' => (int) $order['id'],
        'user_id' => (int) $order['user_id'],
        'status' => $order['status'],
        'total_amount' => (float) $order['total_amount'],
        'customer_name' => $order['customer_name'],
        'customer_email' => $order['customer_email'],
        'created_at' => $order['created_at'] ?? null,
        'updated_at' => $order['updated_at'] ?? null,
        'items' => $items,
    ];
}

function formatOrderItem(array $item): array
{
    return [
        'id' => (int) $item['id'],
        'order_id' => (int) $item['order_id'],
        'book_id' => (int) $item['book_id'],
        'title' => $item['title'],
        'author' => $item['author'],
        'quantity' => (int) $item['quantity'],
        'unit_price' => (float) $item['unit_price'],
        'line_total' => (float) $item['line_total'],
    ];
}

function getOrderItems(PDO $pdo, int $orderId): array
{
    $stmt = $pdo->prepare(
        'SELECT *
         FROM order_items
         WHERE order_id = :order_id
         ORDER BY id ASC'
    );
    $stmt->execute([':order_id' => $orderId]);

    return array_map('formatOrderItem', $stmt->fetchAll());
}
