# BookStore Management

A full-stack bookstore management application built with React, Vite, Tailwind CSS, PHP, and MySQL.

## Project Overview

- `frontend/` contains the React + Vite client.
- `Backend/API/` contains the PHP REST API.
- `Backend/Database/` contains the MySQL schema and migration SQL files.

The frontend sends requests to `/api`. During local development, Vite proxies those requests to the PHP backend running at `http://localhost:8000`.

## Requirements

- PHP 8 or newer with the `pdo_mysql` extension enabled
- MySQL or MariaDB
- Node.js and npm
- MySQL CLI, phpMyAdmin, MySQL Workbench, or another database client

Check the PHP MySQL driver with:

```bash
php -m
```

The module list must include `pdo_mysql`. If API routes return `could not find driver`, enable the PHP MySQL PDO extension for the PHP version running the API.

## Database Setup

This project uses MySQL. The main initialization script is:

```text
Backend/Database/schema.sql
```

The script creates the `bookstore_management` database, creates the required tables and views, and inserts sample data including the default admin account.

### Option 1: Import with MySQL CLI

From the project root, run:

```bash
mysql -u root -p < Backend/Database/schema.sql
```

Enter your MySQL password when prompted.

### Option 2: Import with phpMyAdmin

1. Open phpMyAdmin.
2. Choose the Import tab.
3. Select `Backend/Database/schema.sql`.
4. Run the import.

### Optional: Reset the Database

To delete the existing local database and rebuild it from scratch, import:

```text
Backend/Database/recreate_database.sql
```

This reset script runs `DROP DATABASE IF EXISTS bookstore_management` before recreating the full database.

### Optional: Run Migrations

Additional migration files are stored in:

```text
Backend/Database/migrations/
```

Run migration files in filename order when updating an existing database.

## Database Credentials

For local development, the backend uses these defaults unless you override them:

```text
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bookstore_management
DB_USER=root
DB_PASS=
```

If your MySQL password is not empty, create a local environment file:

```bash
cd Backend/API
copy .env.example .env
```

Then edit `Backend/API/.env` with your MySQL username and password.

Do not commit real database passwords. Keep production credentials in local `.env` files or hosting provider environment variables.

## Execution Steps

Start the application in this order: database, backend server, then frontend client.

### 1. Start MySQL

Make sure your MySQL or MariaDB server is running.

If the database has not been created yet, import `Backend/Database/schema.sql` using one of the database setup methods above.

### 2. Start the Backend API

From the project root, run:

```bash
cd Backend/API
php -c php.ini -S localhost:8000
```

The backend API will run at:

```text
http://localhost:8000
```

Swagger API documentation is available at:

```text
http://localhost:8000/swagger/
```

### 3. Start the Frontend Client

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Default Admin Account

```text
Email: vibolhoun5@gmail.com
Password: Admin@12345
```

Use this account to access admin-only dashboard features such as book management, inventory, customers, orders, and reports.

## API Base URL

In local development, the frontend Vite server proxies `/api` to:

```text
http://localhost:8000
```

For example, frontend requests to `/api/books/get_books.php` are forwarded to the PHP backend.

When running under XAMPP or Apache instead, set the frontend environment variable:

```text
VITE_API_URL=http://localhost/BookStore-Management/Backend/API
```

## Available Endpoints

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

Book create, update, and delete endpoints require an admin bearer token returned from login.

Customer, inventory, dashboard, overview, and report endpoints require an admin bearer token.

Order endpoints require a bearer token. Admin users can list all orders, while customers can list only their own orders.

## Swagger UI

When the backend is running, open:

```text
http://localhost:8000/swagger/
```

The OpenAPI spec is served from:

```text
http://localhost:8000/swagger/openapi.json
```

## Useful Paths

- `Backend/Database/schema.sql` - main database initialization script
- `Backend/Database/recreate_database.sql` - reset and rebuild script
- `Backend/Database/migrations/` - additional SQL migration files
- `Backend/API/config/database.php` - backend database connection configuration
- `frontend/vite.config.js` - frontend development proxy configuration
- `DEPLOYMENT.md` - deployment notes

## Troubleshooting

- If the backend says `could not find driver`, enable the PHP `pdo_mysql` extension.
- If the backend cannot connect to MySQL, check `Backend/API/.env` and confirm MySQL is running.
- If frontend API calls fail, confirm the backend is running at `http://localhost:8000` before starting or refreshing the frontend.
- If the Vite dev server uses a different port, open the URL shown in the terminal.

## Deployment

Live URLs:

- Frontend: `https://bookstore-frontend-fbyn.onrender.com`
- API: `https://bookstore-api-1y53.onrender.com`

Production database credentials should be stored in the hosting provider environment variables and shared securely with authorized team members only.

See the deployment notes for more details:

```text
DEPLOYMENT.md
```
