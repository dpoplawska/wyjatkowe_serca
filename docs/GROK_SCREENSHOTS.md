# Zadanie: screenshoty aplikacji mobilnej do PDF-a dotacyjnego

Cel: 4 zrzuty ekranu aplikacji pacjenta (pakiet `pl.wyjatkoweserca.pacjent`,
Pixel 8 podpięty przez USB) do osadzenia w `docs/Opis_aplikacji_pacjenta_Wyjatkowe_Serca.pdf`
jako strona "Podgląd aplikacji (wersja robocza)".

## Połączenie z telefonem

Pełny przewodnik: sekcja *"Testing the mobile app on a physical device"* w głównym
`README.md`. Skrót:

1. Windows: `usbipd attach --wsl --busid <X>` (USB debugging włączone, port USB 2.0,
   Phone Link zamknięty).
2. WSL: serwer adb musi działać jako root: `sudo adb kill-server; sudo adb start-server`.
3. `adb devices` ma pokazać urządzenie (serial `37211FDJH0067Z`).
4. Ekran nie gaśnie przy zasilaniu: `adb shell settings put global stay_on_while_plugged_in 7`.
   Jeśli ekran zgaśnie: `input keyevent KEYCODE_WAKEUP`, potem `input keyevent 82`
   (telefon nie ma PIN-u — odblokowanie swipe'em).
5. Start aplikacji: `adb shell monkey -p pl.wyjatkoweserca.pacjent 1` (konto Google
   jest już zalogowane, dane wczytują się ~3 s).

## Sterowanie UI (headless)

- Zrzut: `adb exec-out screencap -p > plik.png` (koniecznie `exec-out`).
- Współrzędne elementów: `adb shell uiautomator dump /sdcard/ui.xml && adb shell cat /sdcard/ui.xml`
  → `bounds="[x1,y1][x2,y2]"`, tapnij środek: `adb shell input tap X Y`.
- Tekst: `adb shell input text "Jan%sTestowy"` — **tylko ASCII** (bez polskich znaków!),
  spacja jako `%s`. Czyszczenie pola: tap → `input keyevent KEYCODE_MOVE_END` →
  seria `input keyevent KEYCODE_DEL`. Po wpisaniu `KEYCODE_BACK` zamyka klawiaturę,
  a tap w inne pole wymusza zapis (autosave).
- Nawigacja dolna (taby, środki przycisków): Profil (134,2280) · Leki (404,2280) ·
  Pomiary (674,2280) · INR (944,2280).

## Stan danych demo (co już zrobione, co zostało)

Zasada nadrzędna: **na ekranach wyłącznie fikcyjne dane** — żadnych prawdziwych danych
dziecka (RODO). Dane mają wyglądać realistycznie i schludnie.

Zrobione:
- Imię i nazwisko: `Jan Testowy` (było "Test test").
- Operacja 1, typ: `Operacja Fontana` (było "Mocna"); data 20.03.2026 i 10 dni IT — OK.

Do zrobienia:
1. **Operacja 2, typ = "ee"** — pole EditText, bounds `[126,2157][954,2208]`
   (środek ~`540 2182`; po scrollu współrzędne się zmienią — zrób świeży dump).
   Zamień na np. `Wszczepienie%sCRT-D` (spójne z rozrusznikiem CRT-D w profilu).
2. Przescrolluj profil do końca (`input swipe 540 1800 540 700 400`) i sprawdź
   pozostałe pola (powikłania, choroby współistniejące, zespoły genetyczne itd.) —
   popraw wartości typu "asdf"/"ee"/"123" na realistyczne lub usuń.
3. Zakładki **Leki / Pomiary / INR**: przejrzyj wpisy; głupie wartości popraw
   (np. lek `Warfaryna`, dawka `2,5 mg`, 1×dziennie; pomiary: saturacja 92–97%,
   tętno 80–110; INR 2,0–3,5). Jeśli list jest pusta, dodaj 2–3 wpisy, żeby ekran
   nie świecił pustką (wykres w Pomiarach potrzebuje kilku punktów).
   UWAGA przy dawkach/textach: bez polskich znaków (ograniczenie `input text`).

## Screenshoty do dostarczenia

Katalog docelowy: `docs/screenshots/` (utwórz). Rozdzielczość natywna 1080×2400, PNG:

| Plik | Ekran | Uwagi |
|---|---|---|
| `profil.png` | Profil pacjenta od góry | widoczne "Jan Testowy", wady serca |
| `leki.png` | Leki | lista leków z dawkami |
| `pomiary.png` | Pomiary | najlepiej fragment z wykresem |
| `inr.png` | INR | historia wyników |

Checklist przed każdym zrzutem:
- klawiatura schowana (`KEYCODE_BACK`), żaden dropdown nie jest otwarty;
- brak dialogów/toastów; treść wczytana (nie "Wczytywanie…");
- pasek statusu wygląda zwyczajnie (godzina, bateria — OK, to nie przeszkadza).

## Po zrobieniu

Zapisz PNG w `docs/screenshots/`, NIE commituj — właściciel repo zweryfikuje
zawartość (brak danych rzeczywistych) i zdecyduje o osadzeniu w PDF
(`docs/generate_opis_aplikacji.py` zostanie rozszerzony o stronę z podglądem).

---

## Status (2026-07-25, Grok)

Pliki w `docs/screenshots/` (1080×2400 PNG, z Pixel 8 / `37211FDJH0067Z`):

| Plik | Status | Uwagi |
|---|---|---|
| `profil.png` | OK | Jan Testowy, wady serca, rytm, rozrusznik |
| `leki.png` | OK z zastrzeżeniem | Główny lek: **Warfarin 2.5 mg**; w harmonogramie mogą zostać szare wpisy zakończone (`whoa`) / `bez nazwy` — nie usunęły się w pełni przez UI; karta Warfarin jest czytelna |
| `pomiary.png` | OK | Historia pomiarów (m.in. saturacja, tętno, ciśnienie, diureza) |
| `inr.png` | OK | Kalkulator INR + zakresy terapeutyczne (brak osobnej historii wpisów na zrzucie) |

Poprawki danych demo: Operacja Fontana; op.2 → Wszczepienie CRT-D; op.3 → Operacja Norwood; opis powikłań → Chylothorax; usunięto część śmieciowych leków; Warfarin 2.5 mg.  
**Nie commituj** — weryfikacja właściciela przed PDF.

---

## Runda 3 (2026-07-25, Claude)

Jedno zadanie: **`pomiary.png` — zrób od nowa, tym razem KARTY HISTORII zamiast
wykresów.** Powód: na wykresach etykiety osi X renderują się jako "…" (bug
w aplikacji — etykieta przy każdym z 30+ punktów; naprawa osobno, poza PDF).

Kadr: zakładka Pomiary przescrollowana tak, żeby **u góry kadru był nagłówek
"Historia pomiarów (…)"**, a pod nim 3–4 pełne karty wpisów (data + kolorowe chipy:
Saturacja / Tętno / Ciśnienie / Diureza). **Bez** formularza "Dodaj pomiar" i **bez**
sekcji Wykresy w kadrze (sekcję Wykresy można zwinąć tapnięciem w jej nagłówek,
jeśli wystaje). Dane są już czyste (bez 80/120 i duplikatów) — niczego nie edytuj.

`profil.png`, `leki.png`, `inr.png` — nie ruszaj.

---

## Runda 2 (2026-07-25, Claude — po weryfikacji rundy 1)

`profil.png` i `leki.png` — **zaakceptowane, nie ruszaj**. Dwa zadania:

1. **`pomiary.png` — zrób od nowa.** Powód: na starym zrzucie pierwszy wpis to
   "Ciśnienie 80/120" (wartości zamienione miejscami, czerwony alert) — dane już
   naprawiłem od środka aplikacji (usunięte: wpis 80/120 z 16.05 oraz dwa duplikaty
   wpisów testowych z 25.07; historia ma teraz 30 sensownych wpisów).
   Kadr: sekcja **Wykresy** z zakresem **"Wszystko"** (chip już zaznaczony) — tak, aby
   u góry kadru był tytuł "Saturacja (SpO₂ %)" z chipami zakresów, a niżej wykres
   saturacji i tętna. Telefon zostawiony na zakładce Pomiary, "stay awake" włączone
   (`settings put global stay_on_while_plugged_in 7`).

2. **`inr.png` — zamień.** Stary zrzut pokazuje "Kalkulator INR" (wzór, Oblicz INR,
   zakresy terapeutyczne) — dokument dotacyjny celowo opisuje moduł INR jako
   *rejestr wyników, nie narzędzie diagnostyczne*, więc kalkulator w PDF podważa tę
   narrację. Przescrolluj ekran INR w dół: jeśli istnieje sekcja **historii wyników
   INR** (lista wpisów z datami), skadruj zrzut na nią (bez kalkulatora w kadrze).
   Jeśli historia nie istnieje lub jest pusta i nie da się jej sensownie zapełnić
   2–3 wpisami demo (INR 2,4–3,1, daty z ostatnich tygodni) — **nie rób zrzutu**
   i odnotuj to w statusie; ekran INR po prostu wypadnie z PDF-a.

Zasady bez zmian: tylko dane demo, ASCII w `input text`, klawiatura schowana,
pliki do `docs/screenshots/`, bez commitów.

---

## Status rundy 2 (2026-07-25, Grok)

| Plik | Akcja | Status |
|---|---|---|
| `profil.png` | **nie ruszany** (zaakceptowany r1) | bez zmian |
| `leki.png` | **nie ruszany** (zaakceptowany r1) | bez zmian |
| `pomiary.png` | **przebity** | Wykresy + chip **Wszystko** + Saturacja (SpO₂ %) + Tętno + ciśnienie; bez błędnego 80/120 |
| `inr.png` | **przebity** | Sekcja **Historia pomiarów** z wynikami **2.67 / 2.33 / 2.50 / 2.75** (demo); usunięto śmieci 0.17; **bez** formularza „Oblicz INR” / wzoru w kadrze. Tytuł paska nawigacji nadal „Kalkulator INR” (nazwa ekranu w app) — nad listą widać też skrócone zakresy terapeutyczne (legenda, nie kalkulator). |

**Nie commituj** — weryfikacja właściciela przed PDF.
