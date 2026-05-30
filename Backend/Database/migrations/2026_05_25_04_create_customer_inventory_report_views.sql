USE bookstore_management;

CREATE OR REPLACE VIEW customer_report_view AS
SELECT
  users.id AS customer_id,
  users.name,
  users.email,
  users.profile_picture,
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
WHERE users.role = 'customer'
GROUP BY
  users.id,
  users.name,
  users.email,
  users.profile_picture,
  users.created_at,
  users.updated_at;

CREATE OR REPLACE VIEW inventory_report_view AS
SELECT
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
  books.updated_at;

CREATE OR REPLACE VIEW orders_report_view AS
SELECT
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
  orders.updated_at;
