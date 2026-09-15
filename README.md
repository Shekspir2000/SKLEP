# Ariańska Selection - sklep

Osobny pakiet sklepu Ariańska Selection do testowania i dalszych poprawek.

## Aktualizacja 15.09.2026

Nowy wygląd butiku, zdjęcia produktów i hero, koszyk oraz pełna lokalna symulacja zakupu. Opis aktualnego działania i wymagań produkcyjnych: `SHOP_HANDOFF_2026-09-15.md`.

Podgląd: `sklep.html`. Panel: `admin.html`. Dla wspólnego zapisu pomiędzy stronami najlepiej uruchamiać je pod jednym adresem HTTP. Nowy checkout jest wyłącznie testowy i nie wysyła formularza do PHP/P24.

## Co jest w repozytorium

- `sklep.html` - lista produktów.
- `produkt.html` - karta pojedynczego produktu.
- `sklep-zamowienie.html` - formularz zamówienia.
- `admin.html` - testowy panel dodawania produktów na Vercelu.
- `regulamin-sklepu.html` i `polityka-prywatnosci.html` - dokumenty wymagane przy zamówieniu.
- `assets/shop-products.js` - startowe produkty widoczne na froncie.
- `admin/sklep.php` - panel administracyjny sklepu, docelowo do uruchomienia na serwerze z PHP.
- `admin/sklep_zapisz.php` - zapis produktu z panelu administracyjnego.
- `api/shop_order.php` i `api/bootstrap.php` - szkic backendu zamówień sklepu.

## Ważne

To nie jest jeszcze paczka do wrzucenia na LH. Repo służy do testów i dalszej pracy nad sklepem.

GitHub Pages albo Vercel pokażą statyczne strony sklepu, ale nie uruchomią PHP, docelowego panelu administracyjnego ani płatności.

Testowy panel na Vercelu działa pod `/admin`. Produkty dodane w tym panelu zapisują się tylko w konkretnej przeglądarce przez `localStorage`, więc służą do sprawdzenia procesu, wyglądu i formularzy.

Docelowy panel `/admin/sklep` i zamówienia z prawdziwym zapisem zadziałają dopiero na hostingu z PHP po dodaniu właściwego `api/config.php`.

## Pliki prywatne

Nie wrzucamy:

- `api/config.php`,
- haseł,
- kluczy Przelewy24,
- danych FTP/LH.
