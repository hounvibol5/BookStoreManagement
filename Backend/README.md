# BookStore Backend

PHP and MySQL backend for the BookStore Management frontend.

## Requirements

- PHP 8+ with PDO MySQL enabled
- MySQL or MariaDB
- Apache/XAMPP, Laragon, or another PHP server

Check the PHP driver with:

```text
php -m
```

The module list must include `pdo_mysql`. If API routes return `could not find driver`, enable/install the PHP MySQL PDO extension for the PHP version that runs the API.

## Database Setup

1. Open phpMyAdmin or MySQL CLI.
2. Import this file:

```text
Backend/Database/schema.sql
```

It creates the `bookstore_management` database, required tables, sample categories, sample books, and an admin user.

If you already dropped the database or want to delete everything and rebuild from zero, import:

```text
Backend/Database/recreate_database.sql
```

This reset file runs `DROP DATABASE IF EXISTS bookstore_management` before recreating the full database.

For an existing database, run migration files from:

```text
Backend/Database/migrations
```

Current migration:

```text
Backend/Database/migrations/2026_05_25_add_user_profile_picture.sql
```

Dashboard/database migrations:

```text
Backend/Database/migrations/2026_05_25_01_create_customer_profile_tables.sql
Backend/Database/migrations/2026_05_25_02_create_inventory_catalog_tables.sql
Backend/Database/migrations/2026_05_25_03_create_orders_tables.sql
Backend/Database/migrations/2026_05_25_04_create_customer_inventory_report_views.sql
Backend/Database/migrations/2026_05_25_05_create_overview_views.sql
Backend/Database/migrations/2026_05_25_06_create_dashboard_nav_view.sql
```

Run them in filename order.

Default admin login:

```text
Email: vibolhoun5@gmail.com
Password: Admin@12345
```

## Database Config

The API uses these defaults:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bookstore_management
DB_USER=root
DB_PASS=123456
```

You can override them with environment variables if needed.

For a shared team database, copy `Backend/API/.env.example` to `Backend/API/.env` locally and use the remote database values from the server admin. The API also reads a project-root `.env` as a fallback. Do not commit real database passwords.

## API Base URL

Recommended local development setup:

```text
cd Backend/API
php -c php.ini -S localhost:8000
```

The frontend Vite server proxies `/api` to `http://localhost:8000`, so frontend calls like `/api/books/get_books.php` reach the PHP API.

When running under XAMPP/Apache instead, set the frontend environment variable:

```text
VITE_API_URL=http://localhost/BookStore-Management/Backend/API
```

Available endpoints:

```text
GET    /books/get_books.php
GET    /books/get_book.php?id=1
POST   /books/add_book.php
PUT    /books/update_book.php?id=1
DELETE /books/delete_book.php?id=1
GET    /categories/get_categories.php
POST   /categories/add_category.php
POST   /auth/register.php
POST   /auth/login.php
PUT    /auth/update_profile.php
GET    /customers/get_customers.php
GET    /inventory/get_inventory.php
GET    /reports/get_dashboard_nav.php
GET    /reports/get_overview.php
GET    /reports/get_reports.php
POST   /orders/create_order.php
GET    /orders/get_orders.php
GET    /orders/get_order.php?id=1
```

Book create/update/delete require an admin bearer token returned from login.
Profile updates require a bearer token and support `name` and `profilePicture`.
Customer list requires an admin bearer token.
Inventory summary requires an admin bearer token.
Dashboard navbar counts require an admin bearer token and read `dashboard_nav_view` when migrations are installed.
Overview reports require an admin bearer token and read the dashboard report views when migrations are installed.
Store reports require an admin bearer token and read the dashboard report views when migrations are installed.
Order create/list/detail require a bearer token. Admin users can list all orders; customers can list only their own orders.

## Swagger UI

When the backend is running, open:

```text
http://localhost:8000/swagger/
```

The OpenAPI spec is served from:

```text
http://localhost:8000/swagger/openapi.json
```

## Deployment

See:

```text
../DEPLOYMENT.md
```
