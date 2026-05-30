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
