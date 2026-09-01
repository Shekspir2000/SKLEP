# Nowosci - sklep: prototyp lokalny

Status: zapisane lokalnie na TD w katalogu `_LH_UPLOAD_READY`. Nic z tego prototypu nie zostalo wrzucone na LH.

## Wejscia

- Link tree: `index.html` i `linki.html`, kafel `Nowosci - sklep` pod kaflem `O nas`.
- Lista produktow: `sklep.html`.
- Szczegoly produktu: `produkt.html?id=marynarka-rose-vintage`.
- Zamowienie: `sklep-zamowienie.html?id=marynarka-rose-vintage`.
- Panel administracyjny po wdrozeniu PHP: `/admin/sklep`.

## Dane i pliki

- Produkty startowe: `assets/shop-products.js`.
- Produkty edytowane z panelu beda zapisywane w `data/shop-products.json`.
- Zdjecia dodawane z panelu beda zapisywane w `uploads/products/`.
- Ikona kafla sklepu: `assets/shop-bag-icon.svg`.

## Logistyka

Pierwsza wersja zaklada trzy opcje:

- odbior osobisty przy ul. Arianskiej 18/1,
- Paczkomat InPost przygotowywany recznie przez Furgonetke,
- kurier przygotowywany recznie przez Furgonetke.

To jest najprostszy model na start: sklep zbiera dane do etykiety, a dziewczyny generuja etykiete w Furgonetce. Integracje API Furgonetki mozna dodac pozniej, kiedy bedzie jasne ile bedzie wysylek i jakiego przewoznika wybieracie najczesciej.

## Platnosci

Backend ma przygotowany szkic zamowienia sklepowego i rezerwuje produkt po wyslaniu formularza. Finalne przekierowanie do Przelewy24 nie jest jeszcze podpiete, zeby nie mieszac teraz w dzialajacych platnosciach warsztatow.

Nastepny krok przed wrzuceniem na LH:

- podpiac tworzenie transakcji Przelewy24 dla produktow,
- zdecydowac, czy po platnosci produkt ma automatycznie przechodzic na `sold`,
- ustalic tresc maila do klientki i maila operacyjnego dla zespolu,
- sprawdzic panel `/admin/sklep` juz na serwerze z PHP.
