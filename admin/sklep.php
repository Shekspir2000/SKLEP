<?php

require __DIR__ . '/../api/bootstrap.php';
require_runtime_config();
require_admin();

$products = shop_products();
$orders = [];
try {
    $orders = db()->query("SELECT * FROM shop_orders ORDER BY created_at DESC, id DESC LIMIT 30")->fetchAll();
} catch (Throwable $error) {
    $orders = [];
}

$productCards = '';
foreach ($products as $product) {
    $productCards .= '<article class="admin-workshop-card">'
        . '<div><div class="admin-workshop-title"><h2>' . h((string) $product['name']) . '</h2><span class="admin-workshop-badge">' . h((string) $product['status']) . '</span></div>'
        . '<p>' . h((string) $product['category']) . ' · rozmiar ' . h((string) $product['size']) . ' · ' . number_format((float) $product['price'], 0, ',', ' ') . ' zł</p></div>'
        . '<dl><div><dt>ID</dt><dd>' . h((string) $product['id']) . '</dd></div><div><dt>Zdjęcie</dt><dd>' . h((string) $product['cover']) . '</dd></div></dl>'
        . '</article>';
}

$orderItems = '';
foreach ($orders as $order) {
    $orderItems .= '<article class="submission status-' . h($order['status']) . '">'
        . '<div class="submission-main">'
        . '<p class="submission-date">' . h($order['created_at']) . '</p>'
        . '<h2>' . h($order['product_name']) . '</h2>'
        . '<p>' . h($order['name']) . ' · ' . h($order['email']) . ' · ' . h($order['phone']) . '</p>'
        . '<p>Dostawa: ' . h($order['delivery_method']) . ' · ' . h($order['delivery_address'] ?: 'odbiór osobisty') . '</p>'
        . '<p>Kwota: ' . number_format(((int) $order['amount']) / 100, 2, ',', ' ') . ' zł</p>'
        . '</div>'
        . '<div class="submission-side"><span class="status-pill">' . h($order['status']) . '</span><small>Realizacja: ' . h($order['fulfillment_status']) . '</small></div>'
        . '</article>';
}

if ($orderItems === '') {
    $orderItems = '<p class="admin-empty">Nie ma jeszcze zamówień sklepowych.</p>';
}

render_page(
    'Sklep - panel',
    '<main class="admin-shell">'
    . '<header class="admin-header"><div><p class="section-kicker">Nowości - sklep</p><h1>Produkty i zamówienia</h1></div><a class="admin-action ghost" href="/admin">Wróć do warsztatów</a></header>'
    . '<section class="admin-calendar"><div class="admin-section-heading"><p class="section-kicker">Produkty</p><h2>Lista produktów</h2></div><div class="admin-workshops-list">' . $productCards . '</div></section>'
    . '<section class="checkout-form-panel"><p class="section-kicker">Dodawanie produktu</p><h2>Nowa rzecz</h2>'
    . '<form class="form-grid" method="post" action="/admin/sklep/zapisz" enctype="multipart/form-data">'
    . '<label>Nazwa<input name="name" required></label>'
    . '<label>ID / slug<input name="id" placeholder="np. marynarka-vintage" required></label>'
    . '<label>Kategoria<input name="category" placeholder="Marynarki"></label>'
    . '<label>Rozmiar<input name="size" required></label>'
    . '<label>Cena w zł<input type="number" name="price" min="1" required></label>'
    . '<label>Status<select name="status"><option value="available">available</option><option value="reserved">reserved</option><option value="sold">sold</option></select></label>'
    . '<label>Zdjęcie główne<input type="file" name="cover" accept="image/*"></label>'
    . '<label>Opis<textarea name="description" rows="4"></textarea></label>'
    . '<label>Wymiary<input name="dimensions"></label>'
    . '<label>Materiał<input name="material"></label>'
    . '<button class="admin-action" type="submit">Zapisz produkt</button>'
    . '</form></section>'
    . '<section class="submissions-list"><div class="admin-section-heading"><p class="section-kicker">Logistyka</p><h2>Zamówienia do obsługi</h2></div>' . $orderItems . '</section>'
    . '</main>'
);
