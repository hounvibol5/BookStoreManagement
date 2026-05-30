USE bookstore_management;

CREATE OR REPLACE VIEW dashboard_nav_view AS
SELECT
  (SELECT COUNT(*) FROM books) AS book_count,
  (SELECT COUNT(*) FROM books WHERE stock = 0) AS out_of_stock_count,
  (SELECT COUNT(*) FROM books WHERE stock > 0 AND stock <= 5) AS low_stock_count,
  (SELECT COALESCE(SUM(stock), 0) FROM books) AS inventory_count,
  (SELECT COUNT(*) FROM orders) AS order_count,
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_order_count,
  (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customer_count,
  (SELECT COUNT(*) FROM orders WHERE status <> 'cancelled') AS report_order_count;
