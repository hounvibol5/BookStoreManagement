USE bookstore_management;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_picture LONGTEXT NULL AFTER role;
