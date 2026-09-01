<?php

require __DIR__ . '/bootstrap.php';
require_runtime_config();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    render_message('Nieprawidłowe wejście', 'Zamówienie rozpocznij ze strony produktu.', 'Wróć do sklepu', '/sklep', 405);
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$consent = (string) ($_POST['consent'] ?? '');
$deliveryMethod = (string) ($_POST['delivery_method'] ?? 'pickup');
$deliveryAddress = trim((string) ($_POST['delivery_address'] ?? ''));

if ($name === '' || $email === '' || $phone === '' || $consent !== 'yes' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    render_message('Uzupełnij formularz', 'Sprawdź dane kontaktowe oraz zgodę na regulamin.', 'Wróć do zamówienia', '/sklep-zamowienie?id=' . rawurlencode((string) ($_POST['product_id'] ?? '')), 400);
}

if (!isset(delivery_options()[$deliveryMethod])) {
    render_message('Wybierz dostawę', 'Wybierz jedną z dostępnych metod dostawy.', 'Wróć do zamówienia', '/sklep-zamowienie?id=' . rawurlencode((string) ($_POST['product_id'] ?? '')), 400);
}

if ($deliveryMethod !== 'pickup' && $deliveryAddress === '') {
    render_message('Uzupełnij dostawę', 'Podaj paczkomat albo adres do wysyłki.', 'Wróć do zamówienia', '/sklep-zamowienie?id=' . rawurlencode((string) ($_POST['product_id'] ?? '')), 400);
}

try {
    $order = create_shop_order($_POST);
    render_message(
        'Zamówienie przygotowane',
        'Produkt został zarezerwowany na czas płatności. W następnym kroku podepniemy tu przekierowanie do Przelewy24.',
        'Wróć do sklepu',
        '/sklep'
    );
} catch (Throwable $error) {
    render_message('Nie udało się rozpocząć zamówienia', $error->getMessage(), 'Wróć do sklepu', '/sklep', 500);
}
