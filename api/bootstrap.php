<?php

declare(strict_types=1);

define('APP_ROOT', dirname(__DIR__));
define('APP_DATA_DIR', APP_ROOT . '/data');
define('APP_DB_PATH', APP_DATA_DIR . '/registrations_php.sqlite3');

function local_config_exists(): bool
{
    return is_file(__DIR__ . '/config.php');
}

function app_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $defaults = require __DIR__ . '/config.example.php';
    $local = local_config_exists() ? require __DIR__ . '/config.php' : [];
    $config = array_replace_recursive($defaults, is_array($local) ? $local : []);

    return $config;
}

function require_runtime_config(): void
{
    if (!local_config_exists()) {
        render_message(
            'Brak konfiguracji',
            'Backend online wymaga pliku api/config.php z danymi panelu i Przelewy24.',
            'Wróć na stronę',
            '/',
            503
        );
    }
}

function workshops(): array
{
    return [
        ['id' => '2026-09-25-wino', 'date' => '25 września', 'raw_date' => '25.09', 'time' => '18:30', 'title' => 'Paint & Pre-Loved'],
        ['id' => '2026-10-23-wino', 'date' => '23 października', 'raw_date' => '23.10', 'time' => '18:30', 'title' => 'Paint & Pre-Loved'],
        ['id' => '2026-11-20-wino', 'date' => '20 listopada', 'raw_date' => '20.11', 'time' => '18:30', 'title' => 'Paint & Pre-Loved'],
        ['id' => '2026-12-11-wino', 'date' => '11 grudnia', 'raw_date' => '11.12', 'time' => '18:30', 'title' => 'Paint & Pre-Loved'],
    ];
}

function h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    if (!is_dir(APP_DATA_DIR)) {
        mkdir(APP_DATA_DIR, 0775, true);
    }

    $pdo = new PDO('sqlite:' . APP_DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    init_db($pdo);

    return $pdo;
}

function init_db(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            workshop_id TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            message TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            quantity INTEGER NOT NULL DEFAULT 1,
            amount INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'PLN',
            p24_token TEXT,
            p24_order_id INTEGER,
            p24_method_id INTEGER,
            created_at TEXT NOT NULL,
            expires_at TEXT,
            paid_at TEXT,
            cancelled_at TEXT
        )"
    );

    $columns = $pdo->query("PRAGMA table_info(registrations)")->fetchAll();
    $columnNames = array_map(static fn(array $column): string => (string) $column['name'], $columns);
    if (!in_array('quantity', $columnNames, true)) {
        $pdo->exec("ALTER TABLE registrations ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1");
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS shop_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            delivery_method TEXT NOT NULL,
            delivery_address TEXT,
            delivery_note TEXT,
            fulfillment_status TEXT NOT NULL DEFAULT 'new',
            status TEXT NOT NULL DEFAULT 'pending',
            amount INTEGER NOT NULL,
            delivery_amount INTEGER NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'PLN',
            p24_token TEXT,
            p24_order_id INTEGER,
            p24_method_id INTEGER,
            created_at TEXT NOT NULL,
            expires_at TEXT,
            paid_at TEXT,
            cancelled_at TEXT
        )"
    );
}

function now_iso(): string
{
    return gmdate('Y-m-d H:i:s');
}

function plus_minutes_iso(int $minutes): string
{
    return gmdate('Y-m-d H:i:s', time() + ($minutes * 60));
}

function workshop_timestamp(array $workshop): int
{
    return strtotime(substr($workshop['id'], 0, 10) . ' ' . $workshop['time']) ?: time();
}

function nearest_workshop(): array
{
    $now = time();
    foreach (workshops() as $workshop) {
        if (workshop_timestamp($workshop) >= $now) {
            return $workshop;
        }
    }

    $all = workshops();
    return $all[count($all) - 1];
}

function workshop_by_id(?string $id, ?array $fallback = null): array
{
    foreach (workshops() as $workshop) {
        if ($workshop['id'] === $id) {
            return $workshop;
        }
    }

    return $fallback ?: nearest_workshop();
}

function workshop_label(array $workshop): string
{
    return $workshop['title'] . ' - ' . $workshop['date'] . ', ' . $workshop['time'];
}

function cleanup_expired_reservations(): void
{
    $stmt = db()->prepare(
        "UPDATE registrations
         SET status = 'cancelled', cancelled_at = :now
         WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < :now"
    );
    $stmt->execute([':now' => now_iso()]);
}

function registration_count(string $status, ?string $workshopId = null): int
{
    cleanup_expired_reservations();
    $params = [':status' => $status];
    $sql = "SELECT COALESCE(SUM(quantity), 0) FROM registrations WHERE status = :status";
    if ($workshopId) {
        $sql .= " AND workshop_id = :workshop_id";
        $params[':workshop_id'] = $workshopId;
    }
    if ($status === 'pending') {
        $sql .= " AND (expires_at IS NULL OR expires_at >= :now)";
        $params[':now'] = now_iso();
    }

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return (int) $stmt->fetchColumn();
}

function occupied_places(string $workshopId): int
{
    cleanup_expired_reservations();
    $stmt = db()->prepare(
        "SELECT COALESCE(SUM(quantity), 0) FROM registrations
         WHERE workshop_id = :workshop_id
         AND (
             status = 'paid'
             OR (status = 'pending' AND (expires_at IS NULL OR expires_at >= :now))
         )"
    );
    $stmt->execute([':workshop_id' => $workshopId, ':now' => now_iso()]);
    return (int) $stmt->fetchColumn();
}

function remaining_places(string $workshopId): int
{
    return max(0, (int) app_config()['limit_places'] - occupied_places($workshopId));
}

function requested_quantity(array $form): int
{
    $limit = (int) app_config()['limit_places'];
    $quantity = (int) ($form['quantity'] ?? 1);
    return max(1, min($limit, $quantity));
}

function create_registration(array $form): array
{
    $config = app_config();
    $workshop = workshop_by_id($form['workshop_id'] ?? null);
    $quantity = requested_quantity($form);
    $amount = (int) $config['price_pln'] * 100 * $quantity;
    $sessionId = bin2hex(random_bytes(16));
    $pdo = db();

    cleanup_expired_reservations();

    try {
        $pdo->exec('BEGIN IMMEDIATE');
        if (remaining_places($workshop['id']) < $quantity) {
            $pdo->rollBack();
            render_message('Brak miejsc', 'Nie ma już tylu wolnych miejsc na ten termin.', 'Wróć do terminarza', '/#schedule', 409);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO registrations
             (session_id, workshop_id, name, email, phone, message, status, quantity, amount, currency, created_at, expires_at)
             VALUES
             (:session_id, :workshop_id, :name, :email, :phone, :message, 'pending', :quantity, :amount, 'PLN', :created_at, :expires_at)"
        );
        $stmt->execute([
            ':session_id' => $sessionId,
            ':workshop_id' => $workshop['id'],
            ':name' => trim((string) $form['name']),
            ':email' => trim((string) $form['email']),
            ':phone' => trim((string) $form['phone']),
            ':message' => trim((string) ($form['message'] ?? '')),
            ':quantity' => $quantity,
            ':amount' => $amount,
            ':created_at' => now_iso(),
            ':expires_at' => plus_minutes_iso((int) $config['reservation_hold_minutes']),
        ]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }

    return [
        'id' => (int) $pdo->lastInsertId(),
        'session_id' => $sessionId,
        'workshop' => $workshop,
        'quantity' => $quantity,
        'amount' => $amount,
    ];
}

function find_registration_by_session(string $sessionId): ?array
{
    $stmt = db()->prepare("SELECT * FROM registrations WHERE session_id = :session_id");
    $stmt->execute([':session_id' => $sessionId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function update_registration_payment(string $sessionId, array $values): void
{
    $fields = [];
    $params = [':session_id' => $sessionId];
    foreach ($values as $field => $value) {
        $fields[] = $field . ' = :' . $field;
        $params[':' . $field] = $value;
    }
    if (!$fields) {
        return;
    }

    $stmt = db()->prepare("UPDATE registrations SET " . implode(', ', $fields) . " WHERE session_id = :session_id");
    $stmt->execute($params);
}

function shop_products_path(): string
{
    return APP_DATA_DIR . '/shop-products.json';
}

function seed_shop_products(): array
{
    return [
        [
            'id' => 'marynarka-rose-vintage',
            'name' => 'Marynarka vintage rose',
            'price' => 189,
            'size' => 'M',
            'status' => 'available',
            'category' => 'Marynarki',
            'cover' => 'assets/gallery-1.jpeg',
            'gallery' => ['assets/gallery-1.jpeg', 'assets/warsztaty-grupa.jpeg'],
            'description' => 'Jedyna sztuka z selekcji Ariańska. Miękka linia ramion, piękny kolor i charakter do codziennych stylizacji.',
            'dimensions' => 'szer. pod pachami 52 cm, dł. 72 cm',
            'material' => 'wełna z domieszką',
        ],
        [
            'id' => 'sukienka-kremowa',
            'name' => 'Sukienka kremowa z charakterem',
            'price' => 159,
            'size' => 'S/M',
            'status' => 'available',
            'category' => 'Sukienki',
            'cover' => 'assets/gallery-2.jpeg',
            'gallery' => ['assets/gallery-2.jpeg', 'assets/gallery-3.jpeg'],
            'description' => 'Lekka sukienka do sesji, spotkania albo letniego wieczoru.',
            'dimensions' => 'talia 36 cm, dł. 118 cm',
            'material' => 'wiskoza',
        ],
    ];
}

function shop_products(): array
{
    $path = shop_products_path();
    if (!is_file($path)) {
        return seed_shop_products();
    }
    $decoded = json_decode((string) file_get_contents($path), true);
    return is_array($decoded) ? $decoded : seed_shop_products();
}

function save_shop_products(array $products): void
{
    if (!is_dir(APP_DATA_DIR)) {
        mkdir(APP_DATA_DIR, 0775, true);
    }
    file_put_contents(shop_products_path(), json_encode(array_values($products), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function shop_product_by_id(string $id): ?array
{
    foreach (shop_products() as $product) {
        if ((string) ($product['id'] ?? '') === $id) {
            return $product;
        }
    }
    return null;
}

function delivery_options(): array
{
    return [
        'pickup' => ['label' => 'Odbiór osobisty', 'amount' => 0],
        'parcel_locker' => ['label' => 'Paczkomat InPost przez Furgonetkę', 'amount' => 1700],
        'courier' => ['label' => 'Kurier przez Furgonetkę', 'amount' => 2200],
    ];
}

function create_shop_order(array $form): array
{
    $product = shop_product_by_id((string) ($form['product_id'] ?? ''));
    if (!$product || (string) ($product['status'] ?? '') !== 'available') {
        render_message('Produkt niedostępny', 'Ta rzecz jest już zarezerwowana albo sprzedana.', 'Wróć do sklepu', '/sklep', 409);
    }

    $deliveryMethod = (string) ($form['delivery_method'] ?? 'pickup');
    $delivery = delivery_options()[$deliveryMethod] ?? delivery_options()['pickup'];
    $deliveryAmount = (int) $delivery['amount'];
    $amount = ((int) $product['price'] * 100) + $deliveryAmount;
    $sessionId = 'shop_' . bin2hex(random_bytes(14));

    $stmt = db()->prepare(
        "INSERT INTO shop_orders
         (session_id, product_id, product_name, name, email, phone, delivery_method, delivery_address, delivery_note, status, amount, delivery_amount, currency, created_at, expires_at)
         VALUES
         (:session_id, :product_id, :product_name, :name, :email, :phone, :delivery_method, :delivery_address, :delivery_note, 'pending', :amount, :delivery_amount, 'PLN', :created_at, :expires_at)"
    );
    $stmt->execute([
        ':session_id' => $sessionId,
        ':product_id' => (string) $product['id'],
        ':product_name' => (string) $product['name'],
        ':name' => trim((string) $form['name']),
        ':email' => trim((string) $form['email']),
        ':phone' => trim((string) $form['phone']),
        ':delivery_method' => $deliveryMethod,
        ':delivery_address' => trim((string) ($form['delivery_address'] ?? '')),
        ':delivery_note' => trim((string) ($form['delivery_note'] ?? '')),
        ':amount' => $amount,
        ':delivery_amount' => $deliveryAmount,
        ':created_at' => now_iso(),
        ':expires_at' => plus_minutes_iso((int) app_config()['reservation_hold_minutes']),
    ]);

    $products = shop_products();
    foreach ($products as &$item) {
        if ((string) ($item['id'] ?? '') === (string) $product['id']) {
            $item['status'] = 'reserved';
        }
    }
    unset($item);
    save_shop_products($products);

    return [
        'id' => (int) db()->lastInsertId(),
        'session_id' => $sessionId,
        'product' => $product,
        'amount' => $amount,
    ];
}

function find_shop_order_by_session(string $sessionId): ?array
{
    $stmt = db()->prepare("SELECT * FROM shop_orders WHERE session_id = :session_id");
    $stmt->execute([':session_id' => $sessionId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function update_shop_order_payment(string $sessionId, array $values): void
{
    $fields = [];
    $params = [':session_id' => $sessionId];
    foreach ($values as $field => $value) {
        $fields[] = $field . ' = :' . $field;
        $params[':' . $field] = $value;
    }
    if (!$fields) {
        return;
    }

    $stmt = db()->prepare("UPDATE shop_orders SET " . implode(', ', $fields) . " WHERE session_id = :session_id");
    $stmt->execute($params);
}

function site_url(string $path): string
{
    return rtrim((string) app_config()['base_url'], '/') . '/' . ltrim($path, '/');
}

function p24_configured(): bool
{
    $p24 = app_config()['p24'];
    return !empty($p24['enabled'])
        && (int) $p24['merchant_id'] > 0
        && (int) $p24['pos_id'] > 0
        && (string) $p24['api_key'] !== ''
        && (string) $p24['crc'] !== '';
}

function p24_api_base(): string
{
    return !empty(app_config()['p24']['sandbox'])
        ? 'https://sandbox.przelewy24.pl'
        : 'https://secure.przelewy24.pl';
}

function p24_sign(array $payload): string
{
    return hash('sha384', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function p24_request(string $method, string $endpoint, array $body): array
{
    $p24 = app_config()['p24'];
    $ch = curl_init(p24_api_base() . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_USERPWD => (int) $p24['pos_id'] . ':' . (string) $p24['api_key'],
        CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    ]);

    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($raw === false || $error) {
        throw new RuntimeException('Nie udało się połączyć z Przelewy24: ' . $error);
    }

    $decoded = json_decode((string) $raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Przelewy24 zwróciło nieczytelną odpowiedź.');
    }
    if ($status < 200 || $status >= 300) {
        throw new RuntimeException('Przelewy24 odrzuciło żądanie.');
    }

    return $decoded;
}

function p24_register(array $registration, array $form): string
{
    if (!p24_configured()) {
        throw new RuntimeException('Płatności Przelewy24 nie są jeszcze skonfigurowane.');
    }

    $p24 = app_config()['p24'];
    $workshop = $registration['workshop'];
    $sessionId = $registration['session_id'];
    $quantity = (int) ($registration['quantity'] ?? 1);
    $amount = (int) $registration['amount'];
    $merchantId = (int) $p24['merchant_id'];
    $posId = (int) $p24['pos_id'];

    $body = [
        'merchantId' => $merchantId,
        'posId' => $posId,
        'sessionId' => $sessionId,
        'amount' => $amount,
        'currency' => 'PLN',
        'description' => workshop_label($workshop) . ($quantity > 1 ? ' x ' . $quantity : ''),
        'email' => trim((string) $form['email']),
        'client' => trim((string) $form['name']),
        'country' => 'PL',
        'language' => 'pl',
        'urlReturn' => site_url('/p24/return?session_id=' . rawurlencode($sessionId)),
        'urlStatus' => site_url('/p24/status'),
        'sign' => p24_sign([
            'sessionId' => $sessionId,
            'merchantId' => $merchantId,
            'amount' => $amount,
            'currency' => 'PLN',
            'crc' => (string) $p24['crc'],
        ]),
    ];

    $response = p24_request('POST', '/api/v1/transaction/register', $body);
    $token = $response['data']['token'] ?? null;
    if (!$token) {
        throw new RuntimeException('Przelewy24 nie zwróciło tokenu płatności.');
    }

    update_registration_payment($sessionId, ['p24_token' => $token]);
    return p24_api_base() . '/trnRequest/' . rawurlencode((string) $token);
}

function p24_verify(array $notification, array $registration): bool
{
    if (!p24_configured()) {
        return false;
    }

    $p24 = app_config()['p24'];
    $sessionId = (string) ($notification['sessionId'] ?? $registration['session_id']);
    $orderId = (int) ($notification['orderId'] ?? 0);
    $amount = (int) $registration['amount'];
    if ($orderId <= 0 || $sessionId === '') {
        return false;
    }

    p24_request('PUT', '/api/v1/transaction/verify', [
        'merchantId' => (int) $p24['merchant_id'],
        'posId' => (int) $p24['pos_id'],
        'sessionId' => $sessionId,
        'amount' => $amount,
        'currency' => 'PLN',
        'orderId' => $orderId,
        'sign' => p24_sign([
            'sessionId' => $sessionId,
            'orderId' => $orderId,
            'amount' => $amount,
            'currency' => 'PLN',
            'crc' => (string) $p24['crc'],
        ]),
    ]);

    update_registration_payment($sessionId, [
        'status' => 'paid',
        'p24_order_id' => $orderId,
        'p24_method_id' => (int) ($notification['methodId'] ?? 0),
        'paid_at' => now_iso(),
    ]);

    return true;
}

function read_payload(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $json = json_decode($raw, true);
    return is_array($json) ? $json : ($_POST ?: $_GET);
}

function render_page(string $title, string $content, int $status = 200): void
{
    http_response_code($status);
    echo '<!doctype html><html lang="pl"><head><meta charset="utf-8">';
    echo '<meta name="viewport" content="width=device-width, initial-scale=1">';
    echo '<title>' . h($title) . ' | Ariańska Selection</title>';
    echo '<link rel="stylesheet" href="/styles.css?v=81"></head><body class="plain-page">';
    echo $content;
    echo '</body></html>';
    exit;
}

function render_message(string $title, string $message, string $button, string $href, int $status = 200): void
{
    render_page(
        $title,
        '<main class="message-screen"><section class="message-panel">'
        . '<p class="section-kicker">Ariańska Selection</p>'
        . '<h1>' . h($title) . '</h1>'
        . '<p>' . h($message) . '</p>'
        . '<a class="button button-primary" href="' . h($href) . '">' . h($button) . '</a>'
        . '</section></main>',
        $status
    );
}

function require_admin(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['aria_admin'])) {
        header('Location: /admin/login', true, 303);
        exit;
    }
}

function admin_credentials_ok(string $login, string $password): bool
{
    $config = app_config();
    $hash = (string) $config['admin_password_hash'];
    return $hash !== ''
        && (string) $config['admin_login'] !== ''
        && hash_equals((string) $config['admin_login'], $login)
        && password_verify($password, $hash);
}
