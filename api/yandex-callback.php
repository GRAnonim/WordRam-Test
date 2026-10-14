<?php
declare(strict_types=1);

require __DIR__ . "/store.php";

function backToGame(string $token): void
{
    header("Location: https://wordram.ru/#account_token=" . rawurlencode($token));
    exit;
}

function backWithError(string $message): void
{
    header("Location: https://wordram.ru/#account_error=" . rawurlencode($message));
    exit;
}

$config = yandexConfig();
$clientId = trim((string) ($config["client_id"] ?? ""));
$clientSecret = trim((string) ($config["client_secret"] ?? ""));
$redirectUri = trim((string) ($config["redirect_uri"] ?? "https://wordram.ru/api/yandex-callback.php"));
$state = (string) ($_GET["state"] ?? "");
$expected = (string) ($_COOKIE["wordram_yandex_state"] ?? "");
setcookie("wordram_yandex_state", "", ["expires" => time() - 3600, "path" => "/api/"]);

if ($clientId === "" || $clientSecret === "") {
    backWithError("Вход через Яндекс ещё не включён");
}
if ($state === "" || $expected === "" || !hash_equals($expected, $state)) {
    backWithError("Вход через Яндекс не подтвердился. Попробуйте ещё раз");
}
if (!empty($_GET["error"])) {
    backWithError("Яндекс не разрешил вход");
}
$code = (string) ($_GET["code"] ?? "");
if ($code === "") {
    backWithError("Яндекс не вернул код входа");
}

$tokenBody = http_build_query([
    "grant_type" => "authorization_code",
    "code" => $code,
    "client_id" => $clientId,
    "client_secret" => $clientSecret,
]);
$tokenRaw = httpPost("https://oauth.yandex.ru/token", $tokenBody, [
    "Content-Type: application/x-www-form-urlencoded",
]);
$tokenData = json_decode($tokenRaw, true);
$accessToken = is_array($tokenData) ? (string) ($tokenData["access_token"] ?? "") : "";
if ($accessToken === "") {
    backWithError("Яндекс не выдал доступ");
}

$infoRaw = httpGet("https://login.yandex.ru/info?format=json", [
    "Authorization: OAuth " . $accessToken,
]);
$info = json_decode($infoRaw, true);
if (!is_array($info) || empty($info["id"])) {
    backWithError("Яндекс не прислал профиль");
}

$email = normalizeEmail($info["default_email"] ?? "");
if ($email === "" && !empty($info["emails"][0])) {
    $email = normalizeEmail($info["emails"][0]);
}

$dataDir = __DIR__ . "/data";
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0700, true);
}
$gameToken = issueYandexLogin($dataDir, (string) $info["id"], $email);
backToGame($gameToken);

function httpPost(string $url, string $body, array $headers): string
{
    return httpRequest($url, $body, $headers);
}

function httpGet(string $url, array $headers): string
{
    return httpRequest($url, null, $headers);
}

function httpRequest(string $url, ?string $body, array $headers): string
{
    if (function_exists("curl_init")) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        $result = curl_exec($ch);
        curl_close($ch);
        return is_string($result) ? $result : "";
    }
    $context = stream_context_create([
        "http" => [
            "method" => $body === null ? "GET" : "POST",
            "header" => implode("\r\n", $headers),
            "content" => $body ?? "",
            "timeout" => 20,
        ],
    ]);
    $result = file_get_contents($url, false, $context);
    return is_string($result) ? $result : "";
}
