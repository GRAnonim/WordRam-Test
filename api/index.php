<?php
declare(strict_types=1);

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require __DIR__ . "/store.php";

$dataDir = __DIR__ . "/data";
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0700, true);
}

$action = isset($_GET["action"]) ? (string) $_GET["action"] : "";
if ($_SERVER["REQUEST_METHOD"] === "POST" && $action === "register") {
    handleRegister($dataDir);
}
if ($_SERVER["REQUEST_METHOD"] === "POST" && $action === "login") {
    handleLogin($dataDir);
}
if ($_SERVER["REQUEST_METHOD"] === "GET" && $action === "me") {
    $user = requireUser($dataDir);
    echo json_encode(["ok" => true, "email" => $user["email"]]);
    exit;
}
if ($_SERVER["REQUEST_METHOD"] === "GET" && $action === "save") {
    $user = requireUser($dataDir);
    $path = savePath($dataDir, $user["id"]);
    if (!is_file($path)) {
        echo json_encode(["ok" => true, "state" => null]);
        exit;
    }
    $raw = file_get_contents($path);
    $state = json_decode($raw === false ? "" : $raw, true);
    echo json_encode(["ok" => true, "state" => is_array($state) ? $state : null]);
    exit;
}
if ($_SERVER["REQUEST_METHOD"] === "POST" && $action === "save") {
    $user = requireUser($dataDir);
    $body = readJsonBody();
    $state = isset($body["state"]) && is_array($body["state"]) ? $body["state"] : null;
    if (!$state || !isset($state["progress"]) || !is_array($state["progress"])) {
        fail(400, "Нет сохранения");
    }
    $encoded = json_encode($state, JSON_UNESCAPED_UNICODE);
    if ($encoded === false || strlen($encoded) > 1500000) {
        fail(400, "Сохранение слишком большое");
    }
    file_put_contents(savePath($dataDir, $user["id"]), $encoded, LOCK_EX);
    echo json_encode(["ok" => true]);
    exit;
}

fail(404, "Неизвестный запрос");

function handleRegister(string $dataDir): void
{
    $body = readJsonBody();
    $email = normalizeEmail($body["email"] ?? "");
    $password = (string) ($body["password"] ?? "");
    if ($email === "" || strlen($password) < 8 || strlen($password) > 72) {
        fail(400, "Нужны почта и пароль от 8 символов");
    }
    $users = loadUsers($dataDir);
    foreach ($users as $user) {
        if ($user["email"] === $email) {
            fail(409, "Такая почта уже зарегистрирована");
        }
    }
    $id = bin2hex(random_bytes(16));
    $token = bin2hex(random_bytes(32));
    $users[] = [
        "id" => $id,
        "email" => $email,
        "password_hash" => password_hash($password, PASSWORD_DEFAULT),
        "token_hash" => hash("sha256", $token),
    ];
    saveUsers($dataDir, $users);
    echo json_encode(["ok" => true, "token" => $token, "email" => $email]);
    exit;
}

function handleLogin(string $dataDir): void
{
    $body = readJsonBody();
    $email = normalizeEmail($body["email"] ?? "");
    $password = (string) ($body["password"] ?? "");
    $users = loadUsers($dataDir);
    foreach ($users as $index => $user) {
        if (($user["email"] ?? "") !== $email) {
            continue;
        }
        if (!password_verify($password, (string) ($user["password_hash"] ?? ""))) {
            fail(401, "Неверная почта или пароль");
        }
        $token = bin2hex(random_bytes(32));
        $users[$index]["token_hash"] = hash("sha256", $token);
        saveUsers($dataDir, $users);
        echo json_encode(["ok" => true, "token" => $token, "email" => $email]);
        exit;
    }
    fail(401, "Неверная почта или пароль");
}
