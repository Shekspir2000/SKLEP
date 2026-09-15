# Ariańska Selection: nowy sklep, 15.09.2026

Wersja lokalna HTML/CSS/JS do testów. Bez Next.js, bez wdrożenia na LH i bez prawdziwych płatności. Punktem wyjścia jest osobne repozytorium `/Volumes/4 TB Dysk/CODEX/SKLEP`, nie produkcyjny katalog `_LH_UPLOAD_READY`.

## Wygląd i funkcje

- Kolory marki: #d382bf, #ff575c, #171113, #fff6fa, #f9e9f3.
- Nowy hero z otrzymanego zdjęcia, duża nazwa marki, menu kategorii i oryginalny znak A.
- Cztery produkty ze zdjęć użytkownika. DSC_0097 i DSC_0100 to jedna sukienka, przód i tył.
- Ceny i rozmiary są przykładowe; skład i wymiary wymagają uzupełnienia.
- Filtry kategorii, rozmiaru i statusu; sortowanie; wyszukiwanie; ulubione; koszyk.
- Karta produktu, galeria oraz przełączanie przodu i tyłu na kaflu sukienki.
- Panel `admin.html`: dodawanie, edytowanie i usuwanie produktów, dwa zdjęcia, reset symulowanych zakupów.
- Koszyk nie pozwala dodać dwóch sztuk tego samego produktu.
- Zakup testowy: dostępny -> zarezerwowany na 15 minut -> sprzedany; anulowanie lub wygaśnięcie zwalnia rezerwację.
- Blokada Web Locks ogranicza konflikt dwóch kart tej samej przeglądarki. Nie chroni między urządzeniami i nie jest mechanizmem produkcyjnym.
- Dane panelu są lokalne dla przeglądarki i originu. Przeniesienie pod inny adres nie przenosi danych.

## Przed prawdziwymi płatnościami

1. PHP i wspólna baza MySQL/InnoDB; każdy egzemplarz ma unikalny SKU, dostępność 0/1 i identyfikator aktywnej rezerwacji.
2. Serwer tworzy zamówienie i rezerwuje wszystkie pozycje atomowo w transakcji, ze sprawdzeniem statusu i blokadą wierszy. Dla koszyka wieloproduktowego stosuje stałą kolejność blokowania. Nie ufa cenom ani stanom z przeglądarki.
3. Dopiero po skutecznej rezerwacji rejestruje transakcję P24. Przy błędzie rejestracji zwalnia wyłącznie rezerwacje tego zamówienia. Timeout wymaga sprawdzenia stanu transakcji, nie ślepej ponownej rejestracji.
4. Callback `urlStatus` sprawdza podpis, sesję, kwotę, walutę i identyfikator transakcji; wywołuje `/api/v1/transaction/verify`. Dopiero zweryfikowana płatność finalizuje sprzedaż. Sam powrót klienta przez `urlReturn` nie oznacza zapłaty.
5. Idempotentna obsługa callbacków, unikalny identyfikator transakcji, powtórne powiadomienie nie tworzy nowego zamówienia ani sprzedaży.
6. Wygasłe/anulowane rezerwacje zwalnia zadanie serwera po ustaleniu stanu płatności. Opóźniona płatność do wygasłego zamówienia nie może przejąć produktu już zarezerwowanego lub sprzedanego komuś innemu; trafia do obsługi wyjątku i ewentualnego zwrotu.
7. Sprzedaż stacjonarna musi korzystać z tego samego stanu i blokad. Panel z uwierzytelnianiem, CSRF i walidacją uploadów; sekrety P24 tylko po stronie serwera.
8. Przetestować równoległe zamówienia z różnych sesji, callbacki powtórzone i opóźnione, przerwany zakup, wygaśnięcie, zwroty i sprzedaż stacjonarną. Dopiero potem decyzja użytkownika o wdrożeniu na LH.

Dokumentacja P24: https://developers.przelewy24.pl/yaml/pl_documentation_1.0.yaml

## Pliki

`sklep.html`, `produkt.html`, `sklep-zamowienie.html`, `admin.html`, `assets/boutique.css`, `assets/boutique.js`, `assets/boutique-admin.js`, `assets/shop-products.js`, `assets/shop-storage.js`, `assets/collection/*`, `assets/lucide.min.js`.

Stare pliki PHP pozostawiono jako szkic z poprzedniej wersji. Nowy testowy checkout nie wywołuje tych endpointów. Nie wdrażać ich jako kompletnej integracji płatności.

## Weryfikacja

Sprawdzone w Chrome: szerokości 360, 375, 390, 768 i 1440 px, w tym ekran 375 x 667. Brak poziomego przewijania i błędów JavaScript. Sprawdzono filtry, sortowanie, wyszukiwanie, ulubione, przód/tył sukienki, galerię, pojedynczą ilość w koszyku, dodawanie zdjęcia w panelu, anulowanie i powodzenie symulacji, kolejny zakup po poprzednim, wygaśnięcie oraz konkurencyjne rezerwacje w dwóch kartach. Dwie równoczesne próby rezerwacji zakończyły się dokładnie jednym sukcesem.

Podgląd lokalny: http://127.0.0.1:8093/sklep.html
Panel lokalny: http://127.0.0.1:8093/admin.html

Użytkownik zatwierdził publikację wersji testowej na GitHub i Vercel. Repozytorium: https://github.com/Shekspir2000/SKLEP . Adres sklepu: https://sklep-tan.vercel.app/sklep . Panel: https://sklep-tan.vercel.app/admin . Publikacja nie obejmuje LH ani rzeczywistych płatności. Dane produktów dodanych przez testerki pozostają osobne dla ich przeglądarek.
