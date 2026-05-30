<?php
declare(strict_types=1);

function getJsonInput(): array
{
    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);

    if (!is_array($data)) {
        errorResponse('Invalid JSON request body', 400);
    }

    return $data;
}

function getPositiveInt($value, int $default = 1): int
{
    $number = filter_var($value, FILTER_VALIDATE_INT);

    if ($number === false || $number < 1) {
        return $default;
    }

    return (int) $number;
}

function requireMethod(string $method): void
{
    $currentMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (strtoupper($currentMethod) !== strtoupper($method)) {
        errorResponse('Method not allowed', 405);
    }
}

function cleanString($value): ?string
{
    if ($value === null) {
        return null;
    }

    $value = trim((string) $value);

    return $value === '' ? null : $value;
}

function cleanInt($value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }

    $number = filter_var($value, FILTER_VALIDATE_INT);

    return $number === false ? null : (int) $number;
}

function cleanFloat($value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }

    $number = filter_var($value, FILTER_VALIDATE_FLOAT);

    return $number === false ? null : (float) $number;
}
