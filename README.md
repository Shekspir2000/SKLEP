# Ariańska Selection - sklep

Osobny pakiet sklepu Ariańska Selection do testowania i dalszych poprawek.

## Co jest w repozytorium

- `sklep.html` - lista produktów.
- `produkt.html` - karta pojedynczego produktu.
- `sklep-zamowienie.html` - formularz zamówienia.
- `regulamin-sklepu.html` i `polityka-prywatnosci.html` - dokumenty wymagane przy zamówieniu.
- `assets/shop-products.js` - startowe produkty widoczne na froncie.
- `admin/sklep.php` - panel administracyjny sklepu, docelowo do uruchomienia na serwerze z PHP.
- `admin/sklep_zapisz.php` - zapis produktu z panelu administracyjnego.
- `api/shop_order.php` i `api/bootstrap.php` - szkic backendu zamówień sklepu.

## Ważne

To nie jest jeszcze paczka do wrzucenia na LH. Repo służy do testów i dalszej pracy nad sklepem.

GitHub Pages pokaże statyczne strony sklepu, ale nie uruchomi PHP, panelu administracyjnego ani płatności. Panel `/admin/sklep` i zamówienia zadziałają dopiero na hostingu z PHP po dodaniu właściwego `api/config.php`.

## Pliki prywatne

Nie wrzucamy:

- `api/config.php`,
- haseł,
- kluczy Przelewy24,
- danych FTP/LH.
