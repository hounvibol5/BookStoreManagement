<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/users.php';

requireMethod('POST');

$pdo = getPDO();
ensureUserProfilePictureColumn($pdo);
$input = getJsonInput();

$email = strtolower((string) cleanString($input['email'] ?? ''));
$password = (string) ($input['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    errorResponse('Invalid email or password', 401);
}

$stmt = $pdo->prepare(
    'SELECT id, name, email, password_hash, role, profile_picture
     FROM users
     WHERE email = :email
     LIMIT 1'
);
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    errorResponse('Invalid email or password', 401);
}

$token = createAuthToken($pdo, (int) $user['id']);

jsonResponse([
    'token' => $token,
    'user' => formatUser($user),
]);
