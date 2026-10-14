<?php
declare(strict_types=1);

function authHeader(): string
{
    if (!empty($_SERVER["HTTP_AUTHORIZATION"])) {
        return (string) $_SERVER["HTTP_AUTHORIZATION"];
    }
    if (!empty($_SERVER["REDIRECT_HTTP_AUTHORIZATION"])) {
        return (string) $_SERVER["REDIRECT_HTTP_AUTHORIZATION"];
    }
    if (function_exists("apache_request_headers")) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strcasecmp((string) $key, "Authorization") === 0) {
                return (string) $value;
            }
        }
    }
    return "";
}

function requireUser(string $dataDir): array
{
    $header = authHeader();
    if (!preg_match("/^Bearer\s+([a-f0-9]{64})$/i", $header, $match)) {
        fail(401, "Нужно войти");
    }
    $hash = hash("sha256", $match[1]);
    foreach (loadUsers($dataDir) as $user) {
        if (hash_equals((string) ($user["token_hash"] ?? ""), $hash)) {
            return $user;
        }
    }
    fail(401, "Нужно войти снова");
}

function normalizeEmail($value): string
{
    $email = strtolower(trim((string) $value));
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : "";
}

function readJsonBody(): array
{
    $raw = file_get_contents("php://input");
    $data = json_decode($raw === false ? "" : $raw, true);
    return is_array($data) ? $data : [];
}

function usersPath(string $dataDir): string
{
    return $dataDir . "/users.json";
}

function savePath(string $dataDir, string $id): string
{
    return $dataDir . "/save-" . $id . ".json";
}

function loadUsers(string $dataDir): array
{
    $path = usersPath($dataDir);
    $fp = fopen($path, "c+");
    if ($fp === false) {
        fail(500, "Хранилище недоступно");
    }
    flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($raw === false ? "" : $raw, true);
    return is_array($data) ? $data : [];
}

function saveUsers(string $dataDir, array $users): void
{
    $path = usersPath($dataDir);
    $fp = fopen($path, "c+");
    if ($fp === false) {
        fail(500, "Хранилище недоступно");
    }
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode(array_values($users), JSON_UNESCAPED_UNICODE));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function issueYandexLogin(string $dataDir, string $yandexId, string $email): string
{
    $users = loadUsers($dataDir);
    $found = null;
    foreach ($users as $index => $user) {
        if ((string) ($user["yandex_id"] ?? "") === $yandexId) {
            $found = $index;
            break;
        }
    }
    if ($found === null && $email !== "") {
        foreach ($users as $index => $user) {
            if (($user["email"] ?? "") === $email) {
                $found = $index;
                break;
            }
        }
    }
    if ($found === null) {
        $users[] = [
            "id" => bin2hex(random_bytes(16)),
            "email" => $email !== "" ? $email : ("yandex-" . $yandexId),
            "password_hash" => password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT),
            "token_hash" => "",
            "yandex_id" => $yandexId,
        ];
        $found = count($users) - 1;
    } else {
        $users[$found]["yandex_id"] = $yandexId;
        if ($email !== "" && strpos((string) $users[$found]["email"], "yandex-") === 0) {
            $users[$found]["email"] = $email;
        }
    }
    $token = bin2hex(random_bytes(32));
    $users[$found]["token_hash"] = hash("sha256", $token);
    saveUsers($dataDir, $users);
    return $token;
}

function yandexConfig(): array
{
    $path = __DIR__ . "/yandex-config.php";
    if (!is_file($path)) {
        return [];
    }
    $config = include $path;
    return is_array($config) ? $config : [];
}

function fail(int $code, string $message): void
{
    http_response_code($code);
    echo json_encode(["ok" => false, "error" => $message], JSON_UNESCAPED_UNICODE);
    exit;
}
