<?php
declare(strict_types=1);

function ensureUserProfilePictureColumn(PDO $pdo): void
{
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'profile_picture'");

    if ($stmt && $stmt->fetch()) {
        return;
    }

    $pdo->exec('ALTER TABLE users ADD COLUMN profile_picture LONGTEXT NULL AFTER role');
}

function formatUser(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'profilePicture' => $user['profile_picture'] ?? null,
    ];
}
