<?php
declare(strict_types=1);

function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse(string $message, int $status = 400, $details = null): void
{
    $payload = ['error' => $message];

    if ($details !== null) {
        $payload['details'] = $details;
    }

    jsonResponse($payload, $status);
}
