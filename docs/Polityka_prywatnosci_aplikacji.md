# Polityka prywatności aplikacji „Wyjątkowe Serca – Pacjent”

**Wersja robocza z 15.09.2026 — do weryfikacji przez prawnika przed publikacją.**
Miejsca oznaczone `[DO USTALENIA]` wymagają decyzji fundacji.

Niniejsza polityka dotyczy wyłącznie aplikacji mobilnej „Wyjątkowe Serca – Pacjent” (dalej „Aplikacja”).
Serwis internetowy wyjatkoweserca.pl ma odrębną politykę prywatności.

## 1. Administrator danych

Administratorem danych osobowych jest Fundacja Wyjątkowe Serca z siedzibą w Warszawie,
Aleje Jerozolimskie 123A, 02-017 Warszawa, KRS 0001072904, NIP 7011177987, REGON 527114359 (dalej „Fundacja”).

Kontakt w sprawach ochrony danych: `[DO USTALENIA: iod@wyjatkoweserca.pl lub inny adres]`.
`[DO USTALENIA: czy Fundacja wyznaczyła Inspektora Ochrony Danych. Polityka serwisu WWW mówi, że tak;
opis projektu grantowego mówi, że IOD nie jest wymagany. Oba dokumenty muszą być zgodne.]`

## 2. Kogo dotyczy ta polityka

- rodziców i opiekunów prawnych dziecka z wadą serca, którzy zakładają konto i prowadzą profil pacjenta;
- pacjentów, którzy ukończyli 16 lat i samodzielnie korzystają z Aplikacji;
- dzieci, których dane są wprowadzane do profilu przez rodzica lub opiekuna;
- współopiekunów zaproszonych do profilu przez jego właściciela.

Aplikacja nie jest przeznaczona dla osób poniżej 16. roku życia jako samodzielnych użytkowników.
Dane dziecka poniżej 16 lat wprowadza wyłącznie rodzic lub opiekun prawny, który odpowiada za
prawdziwość i zakres wprowadzanych informacji.

## 3. Jakie dane przetwarzamy

**Dane konta**

- adres e-mail i identyfikator konta Google użyte do logowania;
- data i wersja zaakceptowanego regulaminu i zgód.

**Dane o zdrowiu pacjenta (szczególna kategoria danych, art. 9 RODO)**

- imię i nazwisko pacjenta, grupa krwi;
- rozpoznane wady serca, zaburzenia rytmu, rozrusznik serca, przebyte operacje, powikłania,
  choroby dodatkowe, zespoły genetyczne;
- lista leków, dawki i harmonogram przyjmowania;
- pomiary (saturacja, tętno, ciśnienie) i wyniki INR wraz z datami;
- dokumentacja medyczna w plikach PDF wgrana przez użytkownika (wypisy, wyniki, skierowania).

**Dane techniczne**

- dziennik dostępu do danych pacjenta: kto (identyfikator konta), kiedy, jaką funkcję Aplikacji wywołał
  i czyj profil dotyczyło żądanie; dziennik nie zawiera treści medycznych;
- raporty awarii Aplikacji (Firebase Crashlytics): model urządzenia, wersja systemu i Aplikacji,
  identyfikator konta, ślad błędu; raporty nie zawierają danych o zdrowiu.

Aplikacja nie zbiera lokalizacji, kontaktów, zdjęć ani innych danych z urządzenia poza plikami PDF,
które użytkownik sam wybierze do wgrania.

## 4. Cele i podstawy prawne

| Cel | Podstawa prawna |
|---|---|
| Założenie konta i świadczenie usługi Aplikacji zgodnie z regulaminem | art. 6 ust. 1 lit. b RODO |
| Prowadzenie profilu pacjenta, w tym przechowywanie danych o zdrowiu, leków, pomiarów, wyników INR i dokumentacji medycznej | art. 9 ust. 2 lit. a RODO (wyraźna zgoda) w związku z art. 6 ust. 1 lit. a RODO |
| Udostępnienie profilu współopiekunowi na zaproszenie właściciela | art. 9 ust. 2 lit. a RODO (zgoda właściciela profilu wyrażona przez wysłanie zaproszenia) |
| Dziennik dostępu do danych pacjenta | art. 6 ust. 1 lit. c RODO w związku z art. 5 ust. 2 i art. 32 RODO (rozliczalność i bezpieczeństwo) |
| Raportowanie awarii i utrzymanie Aplikacji | art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes: stabilność i bezpieczeństwo Aplikacji) |
| Ustalenie, dochodzenie lub obrona roszczeń | art. 6 ust. 1 lit. f RODO |

Zgoda na przetwarzanie danych o zdrowiu jest dobrowolna, ale bez niej Aplikacja nie może prowadzić profilu
pacjenta. Zgodę wyraża się na ekranie „Zanim zaczniesz” po pierwszym zalogowaniu. Zgodę można wycofać
w każdej chwili, usuwając konto w sekcji „Prywatność i konto”. Wycofanie zgody nie wpływa na zgodność
z prawem przetwarzania przed jej wycofaniem.

Aplikacja nie podejmuje decyzji w sposób zautomatyzowany i nie profiluje użytkowników. Aplikacja
nie interpretuje danych medycznych, nie stawia diagnoz i nie zaleca dawkowania; wpisy mają charakter
wyłącznie informacyjny i organizacyjny.

## 5. Kto ma dostęp do danych

**W Aplikacji**

- właściciel profilu pacjenta;
- współopiekunowie, których właściciel zaprosił linkiem; zaproszona osoba widzi pełny profil medyczny,
  w tym dokumenty, i może go edytować; właściciel może w każdej chwili odebrać dostęp;
- osoby po stronie Fundacji upoważnione do administrowania Aplikacją, wyłącznie w zakresie niezbędnym
  do zatwierdzania kont, obsługi zgłoszeń i usuwania awarii; każdy taki dostęp jest zapisywany w dzienniku.

**Podmioty przetwarzające**

Dane są przechowywane i przetwarzane w usługach Google Cloud i Firebase dostarczanych przez
Google Ireland Limited na podstawie umowy powierzenia (Google Cloud Data Processing Addendum):

| Usługa | Do czego | Lokalizacja |
|---|---|---|
| Google Cloud Run | serwer Aplikacji | Warszawa (europe-central2) |
| Cloud Firestore | baza danych profili, leków, pomiarów, INR, dziennika dostępu | Warszawa (europe-central2) |
| Cloud Storage | pliki PDF dokumentacji medycznej | Warszawa (europe-central2) |
| Firebase Authentication | logowanie kontem Google | `[DO USTALENIA: usługa globalna; dane uwierzytelniające mogą być przetwarzane w USA — patrz pkt 6]` |
| Firebase Crashlytics | raporty awarii | `[DO USTALENIA: usługa globalna; dane mogą być przetwarzane w USA — patrz pkt 6]` |

Dane o zdrowiu nie są przekazywane żadnym innym podmiotom. Fundacja nie sprzedaje danych i nie
wykorzystuje ich do celów marketingowych.

## 6. Przekazywanie danych poza Europejski Obszar Gospodarczy

Dane o zdrowiu, profile, dokumenty i dziennik dostępu są przechowywane w centrum danych Google
w Warszawie i nie opuszczają EOG.

Firebase Authentication i Firebase Crashlytics są usługami globalnymi Google. Przetwarzane w nich dane
(adres e-mail, identyfikator konta, dane techniczne urządzenia, ślady błędów) mogą być przekazywane do
Stanów Zjednoczonych. Podstawą przekazania jest decyzja Komisji Europejskiej w sprawie ram ochrony danych
UE-USA (EU-U.S. Data Privacy Framework), do których Google LLC przystąpił, oraz standardowe klauzule
umowne zawarte w umowie powierzenia z Google.

`[DO USTALENIA: prawnik powinien potwierdzić podstawę przekazania i sprawdzić, czy polityka serwisu WWW,
która deklaruje brak przekazywania poza EOG, nie wymaga korekty.]`

## 7. Jak długo przechowujemy dane

| Dane | Okres |
|---|---|
| Profil pacjenta, leki, pomiary, INR, dokumentacja | do usunięcia konta przez użytkownika |
| Dane konta i zapis zgody | do usunięcia konta |
| Dziennik dostępu | 90 dni od wpisu, po czym wpis jest automatycznie usuwany |
| Kopie zapasowe bazy danych | 14 dni; dane usunięte z Aplikacji znikają z kopii najpóźniej po tym czasie |
| Niedokończone przesyłanie pliku PDF | 1 dzień |
| Raporty awarii (Crashlytics) | 90 dni, zgodnie z ustawieniami Google |
| Konto nieaktywne | `[DO USTALENIA: np. 24 miesiące bez logowania, po uprzednim powiadomieniu e-mail]` |

## 8. Usunięcie konta

Użytkownik może usunąć konto w Aplikacji w sekcji „Prywatność i konto”. Usunięcie obejmuje profil pacjenta,
leki, pomiary, wyniki INR, dokumenty PDF, zaproszenia oraz konto logowania.

Jeśli do profilu mają dostęp współopiekunowie, właściciel wybiera przy usuwaniu:

- **przekazanie profilu** pierwszemu zaproszonemu współopiekunowi, który staje się jego właścicielem;
  dane pacjenta pozostają w Aplikacji;
- **usunięcie wszystkiego** — dane pacjenta są kasowane, a wszyscy współopiekunowie tracą dostęp.

Współopiekun, który usuwa własne konto, traci tylko dostęp; dane pacjenta pozostają u właściciela profilu.

## 9. Pacjent, który kończy 18 lat

`[DO USTALENIA: opis mechanizmu, który nie jest jeszcze wdrożony. Założenie projektu: po ukończeniu 18 lat
przez pacjenta dostęp rodziców do profilu zostaje wstrzymany; dalszy wgląd wymaga zgody pacjenta, którą
może on w każdej chwili wycofać. Do rozstrzygnięcia: czy konta rodziców są usuwane, czy tylko odłączane.]`

## 10. Prawa użytkownika

Użytkownikowi przysługuje prawo do:

- dostępu do danych i otrzymania ich kopii (dane profilu można w każdej chwili wyeksportować w Aplikacji
  do pliku PDF);
- sprostowania danych (edycja w Aplikacji);
- usunięcia danych (usunięcie konta w Aplikacji lub wniosek do Fundacji);
- ograniczenia przetwarzania;
- przenoszenia danych;
- wycofania zgody w dowolnym momencie;
- wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa.

Rodzic lub opiekun prawny wykonuje te prawa w imieniu dziecka. Wnioski, których nie da się zrealizować
w Aplikacji, należy kierować na adres podany w pkt 1.

## 11. Bezpieczeństwo

- dostęp do danych wyłącznie po zalogowaniu; każde żądanie do serwera jest uwierzytelniane
  i sprawdzane pod kątem uprawnień do danego profilu;
- transmisja szyfrowana (HTTPS); dane w spoczynku szyfrowane przez Google Cloud;
- wgrywanie dokumentów dostępne tylko dla kont zatwierdzonych przez Fundację; limit 50 MB na plik
  i 200 MB na profil; przyjmowane są wyłącznie pliki PDF;
- dziennik dostępu do danych pacjenta przechowywany 90 dni;
- limity liczby żądań do serwera chroniące przed nadużyciami;
- dane zapisane w pamięci telefonu są usuwane przy wylogowaniu.

## 12. Zmiany polityki

O istotnych zmianach polityki Fundacja poinformuje w Aplikacji. Zmiana treści zgody wymaga jej ponownego
zaakceptowania po zalogowaniu. Aktualna wersja polityki jest dostępna w Aplikacji na ekranie zgód
i w sekcji „Prywatność i konto”.

Data ostatniej aktualizacji: `[DO USTALENIA]`
