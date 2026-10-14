<?php
declare(strict_types=1);

require __DIR__ . "/store.php";

$config = yandexConfig();
$clientId = trim((string) ($config["client_id"] ?? ""));
$redirectUri = trim((string) ($config["redirect_uri"] ?? "https://wordram.ru/api/yandex-callback.php"));
if ($clientId === "") {
    http_response_code(503);
    header("Content-Type: text/plain; charset=utf-8");
    echo "Вход через Яндекс ещё не включён.";
    exit;
}

$state = bin2hex(random_bytes(16));
setcookie("wordram_yandex_state", $state, [
    "expires" => time() + 600,
    "path" => "/api/",
    "secure" => true,
    "httponly" => true,
    "samesite" => "Lax",
]);

$query = http_build_query([
    "response_type" => "code",
    "client_id" => $clientId,
    "redirect_uri" => $redirectUri,
    "scope" => "login:email login:info",
    "state" => $state,
]);
header("Location: https://oauth.yandex.ru/authorize?" . $query);
exit;
