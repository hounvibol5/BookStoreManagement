<?php
declare(strict_types=1);

function getBearerToken(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? $_SERVER['Authorization']
        ?? $_SERVER['AUTHORIZATION']
        ?? $_SERVER['REDIRECT_AUTHORIZATION']
        ?? '';

    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();

        if (is_array($headers)) {
            foreach ($headers as $name => $value) {
                if (strtolower((string) $name) === 'authorization') {
                    $header = (string) $value;
                    break;
                }
            }
        }
    }

    if ($header === '' && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();

        if (is_array($headers)) {
            foreach ($headers as $name => $value) {
                if (strtolower((string) $name) === 'authorization') {
                    $header = (string) $value;
                    break;
                }
            }
        }
    }

    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }

    return null;
}

function createAuthToken(PDO $pdo, int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    $stmt = $pdo->prepare(
        'INSERT INTO auth_tokens (user_id, token_hash, expires_at)
         VALUES (:user_id, :token_hash, DATE_ADD(NOW(), INTERVAL 7 DAY))'
    );
    $stmt->execute([
        ':user_id' => $userId,
        ':token_hash' => $tokenHash,
    ]);

    return $token;
}

function getAuthUser(PDO $pdo): ?array
{
    $token = getBearerToken();

    if ($token === null || $token === '') {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT users.id, users.name, users.email, users.role
         FROM auth_tokens
         INNER JOIN users ON users.id = auth_tokens.user_id
         WHERE auth_tokens.token_hash = :token_hash
           AND auth_tokens.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([':token_hash' => hash('sha256', $token)]);

    $user = $stmt->fetch();

    return $user ?: null;
}

function requireAuth(PDO $pdo): array
{
    $user = getAuthUser($pdo);

    if (!$user) {
        errorResponse('Authentication required', 401);
    }

    return $user;
}

function requireAdmin(PDO $pdo): array
{
    $user = requireAuth($pdo);

    if (strtolower(trim((string) ($user['role'] ?? ''))) !== 'admin') {
        errorResponse('Admin permission required', 403);
    }

    return $user;
}
