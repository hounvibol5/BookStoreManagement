# BookStore Management System

A full-stack bookstore management app built with React, Tailwind CSS, PHP, and MySQL.

## Quick Start

### 1. Database Setup

Import the schema in phpMyAdmin or via CLI:

```sql
mysql -u root -p < database/bookstore_db.sql
```

### 2. Backend

- Place the backend folder inside your web server root.
- Edit the backend database configuration with your local DB credentials.
- Make sure Apache has `mod_rewrite` enabled.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Project Structure

```text
BookStore-Management/
+-- frontend/          # React + Tailwind
|   +-- src/
|       +-- components/
|       +-- pages/
|       +-- services/
+-- backend/           # PHP REST API
+-- Backend/API/       # PHP API used by the Vite proxy
+-- database/          # SQL schema
```

## Default Admin Account

- Email: `vibolhoun5@gmail.com`
- Password: `Admin@12345`

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router |
| Backend | PHP 8+, MySQL |
| Server | Apache or PHP built-in server |
