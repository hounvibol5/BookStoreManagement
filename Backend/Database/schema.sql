-- BookStore Management complete database setup.
-- Run this file inside the target database to create/update tables, views, and seed data.
-- This script is non-destructive: it keeps existing data and updates seed rows by id.
-- Safe for Render MySQL first boot and for manual re-runs.
-- For a full local reset that creates the database, use recreate_database.sql.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Core catalog and user tables.

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  profile_picture LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_tokens_user (user_id),
  INDEX idx_auth_tokens_expires_at (expires_at),
  CONSTRAINT fk_auth_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS books (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(180) NOT NULL,
  author_image VARCHAR(255) NULL,
  category_id INT UNSIGNED NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  description TEXT NULL,
  isbn VARCHAR(30) NULL UNIQUE,
  published_year SMALLINT UNSIGNED NULL,
  cover_image VARCHAR(255) NULL,
  rating DECIMAL(2, 1) NULL,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_books_title (title),
  INDEX idx_books_author (author),
  INDEX idx_books_category (category_id),
  INDEX idx_books_stock (stock),
  INDEX idx_books_created_at (created_at),
  CONSTRAINT fk_books_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS book_ratings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  book_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  rating DECIMAL(2, 1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_book_ratings_book_user (book_id, user_id),
  INDEX idx_book_ratings_user (user_id),
  CONSTRAINT fk_book_ratings_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_book_ratings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping and reporting tables.

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  book_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(180) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_book (book_id),
  INDEX idx_order_items_created_at (created_at),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dashboard and report views.

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

-- Seed data.

INSERT INTO categories (id, name, description) VALUES
  (1, 'Fiction', 'Novels, classics, and imagined stories.'),
  (2, 'Non-Fiction', 'Real stories, essays, culture, and knowledge.'),
  (3, 'Science & Technology', 'Science, technology, programming, and discovery.'),
  (4, 'History', 'World history, biographies, and historical analysis.'),
  (5, 'Self-Help', 'Personal growth, habits, mindfulness, and productivity.'),
  (6, 'Children', 'Books for younger readers.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO users (id, name, email, password_hash, role) VALUES
  (1, 'Admin User', 'vibolhoun5@gmail.com', '$2y$12$VzzxSk0YL1whbaRtSUwRbumQSnVK3H21lmONPXR1chzEPuU/nG5ia', 'admin')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  role = VALUES(role);

INSERT INTO books
  (id, title, author, author_image, category_id, price, stock, description, isbn, published_year, cover_image, rating, review_count)
VALUES
  (1, 'The Great Gatsby', 'F. Scott Fitzgerald', NULL, 1, 12.99, 50, 'A story of the Jazz Age and the American Dream set in the 1920s.', '9780743273565', 1925, NULL, 4.7, 128),
  (2, 'Clean Code', 'Robert C. Martin', NULL, 3, 35.99, 30, 'A handbook of agile software craftsmanship for developers.', '9780132350884', 2008, NULL, 4.8, 214),
  (3, 'Sapiens', 'Yuval Noah Harari', NULL, 2, 18.99, 45, 'A brief history of humankind from the Stone Age to the present.', '9780062316097', 2011, NULL, 4.6, 176),
  (4, 'Atomic Habits', 'James Clear', NULL, 5, 16.99, 60, 'Build good habits and break bad ones with proven strategies.', '9780735211292', 2018, NULL, 4.9, 309),
  (5, '1984', 'George Orwell', NULL, 1, 11.99, 40, 'A chilling dystopian novel about totalitarianism and surveillance.', '9780451524935', 1949, NULL, 4.5, 142),
  (6, 'A Brief History of Time', 'Stephen Hawking', NULL, 3, 14.99, 25, 'From the Big Bang to black holes - science for everyone.', '9780553380163', 1988, NULL, 4.4, 98),
  (7, 'To Kill a Mockingbird', 'Harper Lee', NULL, 1, 13.99, 35, 'A powerful story of racial injustice and moral growth in the American South.', '9780061935466', 1960, NULL, 4.8, 231),
  (8, 'The Power of Now', 'Eckhart Tolle', NULL, 5, 15.99, 0, 'A guide to spiritual enlightenment and living in the present moment.', '9781577314806', 1997, NULL, 4.3, 87)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  author = VALUES(author),
  author_image = VALUES(author_image),
  category_id = VALUES(category_id),
  price = VALUES(price),
  stock = VALUES(stock),
  description = VALUES(description),
  published_year = VALUES(published_year),
  cover_image = VALUES(cover_image),
  rating = VALUES(rating),
  review_count = VALUES(review_count);

SET FOREIGN_KEY_CHECKS = 1;
