<?php

require __DIR__ . '/../api/bootstrap.php';
require_runtime_config();
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /admin/sklep', true, 303);
    exit;
}

$id = preg_replace('/[^a-z0-9-]+/', '-', strtolower(trim((string) ($_POST['id'] ?? ''))));
if ($id === '') {
    header('Location: /admin/sklep', true, 303);
    exit;
}

$cover = 'assets/gallery-1.jpeg';
if (!empty($_FILES['cover']['tmp_name']) && is_uploaded_file($_FILES['cover']['tmp_name'])) {
    $ext = strtolower(pathinfo((string) $_FILES['cover']['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
        $ext = 'jpg';
    }
    $uploadDir = APP_ROOT . '/uploads/products';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }
    $target = $uploadDir . '/' . $id . '-' . time() . '.' . $ext;
    if (move_uploaded_file($_FILES['cover']['tmp_name'], $target)) {
        $cover = 'uploads/products/' . basename($target);
    }
}

$product = [
    'id' => $id,
    'name' => trim((string) ($_POST['name'] ?? '')),
    'price' => max(1, (int) ($_POST['price'] ?? 1)),
    'size' => trim((string) ($_POST['size'] ?? '')),
    'status' => in_array((string) ($_POST['status'] ?? ''), ['available', 'reserved', 'sold'], true) ? (string) $_POST['status'] : 'available',
    'category' => trim((string) ($_POST['category'] ?? 'Nowości')),
    'cover' => $cover,
    'gallery' => [$cover],
    'description' => trim((string) ($_POST['description'] ?? '')),
    'dimensions' => trim((string) ($_POST['dimensions'] ?? '')),
    'material' => trim((string) ($_POST['material'] ?? '')),
];

$products = shop_products();
$replaced = false;
foreach ($products as &$item) {
    if ((string) ($item['id'] ?? '') === $id) {
        if ($cover === 'assets/gallery-1.jpeg' && !empty($item['cover'])) {
            $product['cover'] = $item['cover'];
            $product['gallery'] = $item['gallery'] ?? [$item['cover']];
        }
        $item = $product;
        $replaced = true;
        break;
    }
}
unset($item);

if (!$replaced) {
    $products[] = $product;
}

save_shop_products($products);
header('Location: /admin/sklep', true, 303);
exit;
