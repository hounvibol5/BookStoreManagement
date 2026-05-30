# BookStore Deployment

This project has two deployable parts:

- `frontend/`: React/Vite static site
- `Backend/API/`: PHP API connected to MySQL

Recommended simple deployment: one VPS with Apache, PHP, MySQL, and the built frontend served as static files.

## Production Requirements

- Ubuntu server or similar Linux VPS
- Apache or Nginx
- PHP 8+ with `pdo_mysql`
- MySQL 8 or MariaDB
- Node.js 20+ for building the frontend
- Domain name pointing to the server

## 1. Install Server Packages

Ubuntu example:

```bash
sudo apt update
sudo apt install -y apache2 mysql-server php php-mysql php-cli unzip
```

Enable Apache rewrite:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

## 2. Create Database

Copy the project to the server, then import:

```bash
mysql -u root -p < Backend/Database/schema.sql
```

The default seeded admin account is:

```text
Email: vibolhoun5@gmail.com
Password: Admin@12345
```

For production, create a dedicated database user:

```sql
CREATE USER 'bookstore_app'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON bookstore_management.* TO 'bookstore_app'@'localhost';
FLUSH PRIVILEGES;
```

## 3. Configure API Environment

The PHP API reads these environment variables:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bookstore_management
DB_USER=bookstore_app
DB_PASS=123456
```

In Apache, set them in the virtual host with `SetEnv`.

## 4. Build Frontend

Set the production API URL before building:

```bash
cd frontend
npm install
VITE_API_URL=https://your-domain.com/api npm run build
```

The static production files will be in:

```text
frontend/dist
```

## 5. Apache Virtual Host Example

Copy frontend build output to:

```bash
sudo mkdir -p /var/www/bookstore/frontend
sudo cp -r frontend/dist/* /var/www/bookstore/frontend/
sudo mkdir -p /var/www/bookstore/api
sudo cp -r Backend/API/* /var/www/bookstore/api/
```

Create:

```text
/etc/apache2/sites-available/bookstore.conf
```

Example:

```apache
<VirtualHost *:80>
    ServerName your-domain.com

    DocumentRoot /var/www/bookstore/frontend

    SetEnv DB_HOST localhost
    SetEnv DB_PORT 3306
    SetEnv DB_NAME bookstore_management
    SetEnv DB_USER bookstore_app
    SetEnv DB_PASS 123456

    <Directory /var/www/bookstore/frontend>
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    Alias /api /var/www/bookstore/api

    <Directory /var/www/bookstore/api>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Enable the site:

```bash
sudo a2ensite bookstore.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

## 6. HTTPS

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

## 7. Test Deployment

Check API:

```bash
curl https://your-domain.com/api/
curl https://your-domain.com/api/books/get_books.php
```

Open Swagger:

```text
https://your-domain.com/api/swagger/
```

Open frontend:

```text
https://your-domain.com
```

## 8. Backups

Daily MySQL backup example:

```bash
mkdir -p /var/backups/bookstore
mysqldump -u bookstore_app -p bookstore_management > /var/backups/bookstore/bookstore_$(date +%F).sql
```

Add it to cron after confirming the command works.

## Shared Team Database

Use this only when the team must connect to one central MySQL database. For normal development, local databases are safer and faster.

### 1. Create a MySQL User for Remote Team Access

On the VPS or database server:

```sql
CREATE USER 'bookstore_team'@'%' IDENTIFIED BY '123456';
GRANT SELECT, INSERT, UPDATE, DELETE ON bookstore_management.* TO 'bookstore_team'@'%';
FLUSH PRIVILEGES;
```

Use a strong password. Do not use the MySQL `root` user for teammates.

### 2. Allow MySQL to Listen for Remote Connections

On Ubuntu MySQL, edit:

```text
/etc/mysql/mysql.conf.d/mysqld.cnf
```

Change:

```text
bind-address = 127.0.0.1
```

To:

```text
bind-address = 0.0.0.0
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

### 3. Firewall

Do not open MySQL to everyone. Allow only teammate public IPs:

```bash
sudo ufw allow from TEAMMATE_PUBLIC_IP to any port 3306 proto tcp
```

Check status:

```bash
sudo ufw status
```

### 4. Values to Give Teammates

Give teammates these values privately:

```text
DB_HOST=your-server-ip-or-domain
DB_PORT=3306
DB_NAME=bookstore_management
DB_USER=bookstore_team
DB_PASS=123456
```

They should not commit these values. Each teammate can copy `.env.example` to `.env` and put their real values there.

### 5. Safer Alternative

The safest production design is:

```text
Frontend -> Backend API -> MySQL
```

In that setup, teammates and users never connect directly to MySQL. They only call the deployed API.

## Local Reminder

For local development:

```bash
cd Backend/API
php -c php.ini -S localhost:8000
```

```bash
cd frontend
npm run dev
```
