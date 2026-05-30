<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/request.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/users.php';

requireMethod('PUT');

$pdo = getPDO();
ensureUserProfilePictureColumn($pdo);
$user = requireAuth($pdo);
$input = getJsonInput();

$nameProvided = array_key_exists('name', $input);
$pictureProvided = array_key_exists('profilePicture', $input);

if (!$nameProvided && !$pictureProvided) {
    errorResponse('No profile fields were provided', 422);
}

$updates = [];
$params = [':id' => (int) $user['id']];

if ($nameProvided) {
    $name = cleanString($input['name'] ?? null);

    if (!$name) {
        errorResponse('Name is required', 422);
    }

    if (strlen($name) > 120) {
        errorResponse('Name must be 120 characters or fewer', 422);
    }

    $updates[] = 'name = :name';
    $params[':name'] = $name;
}

if ($pictureProvided) {
    $profilePicture = cleanString($input['profilePicture'] ?? null);

    if ($profilePicture !== null) {
        if (!preg_match('/^data:image\/(png|jpe?g|webp|gif);base64,/i', $profilePicture)) {
            errorResponse('Profile picture must be a base64 image data URL', 422);
        }

        if (strlen($profilePicture) > 1500000) {
            errorResponse('Profile picture must be smaller than 1.5 MB', 422);
        }
    }

    $updates[] = 'profile_picture = :profile_picture';
    $params[':profile_picture'] = $profilePicture;
}

$stmt = $pdo->prepare(
    'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = :id'
);
$stmt->execute($params);

$userStmt = $pdo->prepare(
    'SELECT id, name, email, role, profile_picture
     FROM users
     WHERE id = :id
     LIMIT 1'
);
$userStmt->execute([':id' => (int) $user['id']]);

jsonResponse(formatUser($userStmt->fetch()));
