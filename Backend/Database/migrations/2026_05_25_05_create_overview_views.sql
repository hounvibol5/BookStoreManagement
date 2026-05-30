USE bookstore_management;

CREATE OR REPLACE VIEW overview_summary_view AS
SELECT
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
    WHERE status = 'paid'
  ) AS paid_revenue,
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
  ) AS orders_last_30_days;

CREATE OR REPLACE VIEW daily_sales_report_view AS
SELECT
  DATE(orders.created_at) AS sales_date,
  COUNT(DISTINCT orders.id) AS order_count,
  COALESCE(SUM(order_items.quantity), 0) AS items_sold,
  COALESCE(SUM(orders.total_amount), 0) AS revenue
FROM orders
LEFT JOIN order_items ON order_items.order_id = orders.id
WHERE orders.status <> 'cancelled'
GROUP BY DATE(orders.created_at)
ORDER BY sales_date DESC;

CREATE OR REPLACE VIEW category_inventory_report_view AS
SELECT
  categories.id AS category_id,
  COALESCE(categories.name, 'Uncategorized') AS category_name,
  COUNT(books.id) AS book_count,
  COALESCE(SUM(books.stock), 0) AS total_stock,
  COALESCE(SUM(books.stock * books.price), 0) AS stock_value,
  COALESCE(SUM(CASE WHEN books.stock = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_count,
  COALESCE(SUM(CASE WHEN books.stock > 0 AND books.stock <= 5 THEN 1 ELSE 0 END), 0) AS low_stock_count
FROM books
LEFT JOIN categories ON categories.id = books.category_id
GROUP BY categories.id, categories.name;
