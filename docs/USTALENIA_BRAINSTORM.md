# Ustalenia z brainstormingu — aplikacja pacjenta i wniosek o dotację

Źródło: `todo.txt` (notatki dyktowane, 2026-07-26). Ten plik jest uporządkowaną
wersją tamtych notatek — `todo.txt` można traktować jako archiwum.

Legenda: **[W]** dotyczy wniosku (PDF `Opis_aplikacji_pacjenta_Wyjatkowe_Serca.pdf`) ·
**[D]** dotyczy rozwoju aplikacji/serwisu · **[W+D]** jedno i drugie.

---

## 1. Wniosek — zmiany treści i narracji  [W]

- [x] **Rada naukowa** (str. 2, „O fundacji"): zamiast „Rada Naukowa złożona z lekarzy" →
      „złożona z lekarzy **kardiologów, kardiochirurgów i perinatologów**".
- [x] **Grupa docelowa**: dopisać **młodzież ok. 16 lat** jako główną grupę (obok rodziców
      i opiekunów).
- [x] **Uzasadnienie — usamodzielnianie nastolatków**: aplikacja pomaga wyrobić dobre nawyki
      u 16-latków, uczy samodzielnej opieki nad własnym zdrowiem — z myślą o pełnoletności
      i przejściu pod opiekę placówki dla dorosłych.
- [x] **Problem i uzasadnienie**: usunąć wzmiankę o **słowniku wad i operacji**.
- [x] **Problem i uzasadnienie**: dopisać **historię leczenia i hospitalizacji** prowadzoną
      w aplikacji.
- [x] **Sklepy**: przejrzeć wszystkie miejsca mówiące o „sklepach" / „kartach sklepowych"
      i doprecyzować, że chodzi o **sklepy z aplikacjami (Google Play, App Store)**,
      w których aplikacja będzie **bezpłatna** — a nie o sklep wewnątrz aplikacji ani
      jakąkolwiek sprzedaż.
- [x] **Pomoc psychologiczna**: dopisać, że osoby korzystające z aplikacji — dzięki temu, że
      fundacja je zauważy — będą mogły skorzystać z **bezpłatnych konsultacji
      psychologicznych**. Dodać też do **Podsumowania**.
- [x] **Strona tytułowa**: usunąć dolny wiersz („Interfejs w języku polskim · Publikacja
      w Google Play i App Store · Dokument spójny z kosztorysem projektu").
- [x] **Usunąć sformułowanie „natywna aplikacja"** (obecnie w ramce „Dlaczego aplikacja
      mobilna?").
- [x] **Wykaz istniejących funkcji**: dodać szczegółowe zestawienie tego, co w aplikacji
      **już działa** — jako uzasadnienie liczby godzin wkładu własnego.

## 2. Wniosek — zakres funkcjonalny  [W+D]

Funkcje do dopisania do **zakresu v1** (rozdz. 3.1) i do zbudowania w aplikacji:

- [x] **Dokumentacja medyczna (PDF)**: przycisk w profilu pacjenta pozwalający dodać
      dokument PDF **wraz z datą dokumentu**.
- [x] **Panel danych opiekunów/rodziców**: osobna sekcja w profilu pacjenta z danymi
      rodziców lub opiekunów.
- [x] **Historia leczenia i hospitalizacji**: dopisać do głównych obszarów nawigacji
      aplikacji (obok Profil / Leki / Pomiary / INR).
- [x] **Logowanie**: przeredagować opis — logowanie kontem Google; rozważyć, czy na iOS
      da się oprzeć na koncie Google zamiast Sign in with Apple (patrz „Pytania otwarte").

Funkcje do dopisania **poza zakresem v1** (rozdz. 3.2), jako kierunek rozwoju:

- [x] **Kalendarz i zapisy do psychologa** — wybór wolnych terminów przez rodzica
      (model jak w Booksy). Wyraźnie oznaczyć jako **poza zakresem v1**.
- [x] **Przekazywanie zanonimizowanych danych medycznych do celów naukowych** — jeśli
      wejdzie do wniosku, to z opisem podstawy RODO (patrz „Pytania otwarte").

## 3. Wniosek — budżet i kosztorys  [W]

- [x] **Docelowa suma projektu: 300 000 zł** — podnieść wycenę wytworzenia aplikacji
      oraz dotychczasowego wkładu własnego tak, aby kwota końcowa wyszła na tym poziomie.
- [x] **Wkład własny: ok. 300 h** zamiast obecnych 180 h (spójnie z wykazem istniejących
      funkcji z sekcji 1).
- [x] **Utrzymanie — wynagrodzenie miesięczne**: zamiast stawki godzinowej wpisać
      **miesięczne wynagrodzenie za dostępność programisty**; tę samą informację dodać
      w rozdz. 9 („Utrzymanie po wdrożeniu").
- [x] **Okres utrzymania**: 12 miesięcy **po zakończeniu prac nad aplikacją** (nie równolegle
      od startu projektu).
- [x] **Hosting/chmura w fazie budowy**: doliczyć koszty hostingu i chmury również za czas
      pracy nad aplikacją (dziś ujęte tylko w bloku utrzymania).
- [x] **Przeliczyć koszty serwera** przy założeniu: **100 użytkowników**, każdy wgrywa PDF-y
      (skrajnie: dokument ~100 stron ze skanami) → zaktualizować roczny koszt hostingu.

## 4. Rozwój aplikacji i serwisu  [D]

- [ ] **Formularz kontaktowy na stronie fundacji** (nie w aplikacji): rodzic zostawia dane,
      formularz wysyła e-mail do fundacji. Treść:
      > Drogi rodzicu, jeśli spodziewasz się dziecka z wadą serca lub masz dziecko z wadą
      > serca — jesteśmy po to, żeby Ci pomóc. Zostaw swoje dane, a my skontaktujemy się z Tobą.
- [ ] **Upload plików — zabezpieczenia**: limit wielkości pliku oraz włączenie uploadu
      **tylko dla użytkowników zatwierdzonych** przez fundację.
- [ ] **Pełna lista wad serca**: obecnie słownik nie zawiera wszystkich wad — trzeba go
      uzupełnić (uwaga: samą wzmiankę o słowniku usuwamy z wniosku, ale prace zostają).
- [ ] **Ukończenie 18 lat przez pacjenta**: po osiągnięciu pełnoletności odciąć dostęp
      rodziców do danych i pokazać pacjentowi zgodę na ewentualne przywrócenie im dostępu.

## 5. Pytania otwarte — do rozstrzygnięcia przed złożeniem wniosku

1. **Dane naukowe a RODO**: na jakiej podstawie przekazywać zanonimizowane dane medyczne
   do celów naukowych? Do ustalenia: czy dane są anonimizowane (poza RODO), czy tylko
   pseudonimizowane (nadal dane osobowe → potrzebna odrębna, dobrowolna zgoda i opis
   w polityce prywatności).
2. **Pełnoletność pacjenta**: czy konto rodzica **kasować**, czy tylko **archiwizować**
   dostęp? Wpływa na zapisy o usuwaniu danych w rozdz. 6.
3. **Logowanie na iOS**: App Store wymaga „Sign in with Apple", jeśli aplikacja oferuje
   logowanie innym kontem społecznościowym (m.in. Google). Rezygnacja z Apple wymaga
   sprawdzenia aktualnych wytycznych — inaczej ryzyko odrzucenia przy weryfikacji.
4. **Kwota 300 000 zł a limit konkursu**: obecny kosztorys to 131 500 zł. Zanim podniesiemy
   wycenę, warto sprawdzić maksymalną kwotę dofinansowania w regulaminie konkursu —
   przekroczenie limitu bywa powodem odrzucenia wniosku na etapie formalnym.
5. **Konsultacje psychologiczne**: kto je finansuje i prowadzi? Jeśli mają być elementem
   projektu, powinny mieć pozycję w kosztorysie; jeśli to działanie statutowe fundacji
   poza projektem — opisać je jako wkład własny/kontekst, nie jako koszt.
