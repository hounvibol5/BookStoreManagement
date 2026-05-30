<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/users.php';

requireMethod('POST');

$pdo = getPDO();
ensureUserProfilePictureColumn($pdo);
$input = getJsonInput();

$name = cleanString($input['name'] ?? null);
$email = strtolower((string) cleanString($input['email'] ?? ''));
$password = (string) ($input['password'] ?? '');

if (!$name) {
    errorResponse('Name is required', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('A valid email is required', 422);
}

if (strlen($password) < 6) {
    errorResponse('Password must be at least 6 characters', 422);
}

$exists = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
$exists->execute([':email' => $email]);

if ($exists->fetch()) {
    errorResponse('Email is already registered', 409);
}

$stmt = $pdo->prepare(
    'INSERT INTO users (name, email, password_hash, role, profile_picture)
     VALUES (:name, :email, :password_hash, :role, :profile_picture)'
);
$stmt->execute([
    ':name' => $name,
    ':email' => $email,
    ':password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ':role' => 'customer',
    ':profile_picture' => null,
]);

jsonResponse([
    'message' => 'Registration successful',
    'user' => formatUser([
        'id' => (int) $pdo->lastInsertId(),
        'name' => $name,
        'email' => $email,
        'role' => 'customer',
        'profile_picture' => null,
    ]),
], 201);
