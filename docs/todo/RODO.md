# Zgodność z RODO — lista zadań

Źródła: rozdz. 6 opisu aplikacji (`docs/generate_opis_aplikacji.py`), faza F3 i pozycje 9–14 kosztorysu,
`docs/ZADANIA_PO_RECENZJI.md` (sekcja „RODO i regulacje"), `docs/USTALENIA_BRAINSTORM.md` (pytania otwarte).

## Stan na 14.09.2026

- W aplikacji mobilnej nie ma ekranu zgód — nic nie zapisuje akceptacji regulaminu ani zgody art. 9.
- Brak usuwania konta przez użytkownika. Jedyne kasowanie to endpoint dev-only w `backend/app/routes.py`
  (bez autoryzacji, nie usuwa dokumentów medycznych ze Storage ani kolekcji `documents`).
- Brak dziennika dostępu i limitów zapytań. Dokumentacja FastAPI (`/docs`) jest publiczna.
- Cloud Run działa w `europe-central2`; region Firestore i Storage do potwierdzenia.
- Crashlytics jest włączony — musi trafić do polityki prywatności jako podmiot przetwarzający.

## Aplikacja i API

- [x] (14.09.2026) Ekran akceptacji regulaminu i zgody na dane o zdrowiu (art. 9 ust. 2 lit. a) przy pierwszym logowaniu;
      zapis w `users/{uid}.consent` z datą i wersją (`CONSENT_VERSION` w `backend/app/routes.py`); API odrzuca
      dostęp do danych pacjenta bez aktualnej zgody (403 `consent_required`). Treść zgód robocza, do podmiany po opinii prawnika.
- [x] (14.09.2026) Podgląd daty i wersji zgody w sekcji „Prywatność i konto" profilu; wycofanie = usunięcie konta.
- [x] (14.09.2026) `DELETE /account` + przycisk „Usuń konto" w profilu: profil, leki, pomiary, INR, dokumenty
      (Storage + Firestore), zaproszenia, `users`, `userAccess`, konto Firebase Auth. Właściciel ze współopiekunami
      wybiera: przekazanie danych pierwszemu opiekunowi albo pełne usunięcie (`purge`). Testy w `backend/tests/test_account_delete.py`.
- [ ] Komunikat przy zaproszeniu współopiekuna: druga osoba uzyska pełny wgląd w dane medyczne profilu.
- [ ] Informacja o roli opiekuna prawnego przy danych dziecka.
- [x] (14.09.2026) Linki do polityki prywatności i regulaminu na ekranie zgód i w sekcji „Prywatność i konto".
- [ ] Wyłączenie `/docs` i `/openapi.json` w prod.
- [ ] Limity zapytań na trasach pacjenta (slowapi jest już na płatnościach); limit wielkości uploadu i zatwierdzanie kont już są.
- [ ] Przegląd sekretów i uprawnień kont serwisowych (zasada minimalnych uprawnień).
- [ ] Middleware dziennika dostępu: uid, ścieżka, metoda, czas, bez treści klinicznej; ustalona retencja logów.
- [ ] Pełnoletność pacjenta: odcięcie dostępu rodziców po 18. r.ż., zgoda pacjenta na przywrócenie dostępu
      (odwoływalna). Wymaga decyzji: kasować czy archiwizować konta rodziców.
- [ ] Potwierdzić region Firestore i Storage (EU); włączyć harmonogram kopii zapasowych Firestore.

## Dokumenty i decyzje (fundacja + prawnik)

- [ ] Aktualizacja polityki prywatności pod aplikację: administrator, kontakt ds. ochrony danych, podstawy prawne,
      podmioty przetwarzające (Google Cloud, Firebase Auth, Firestore, Storage, Crashlytics), okresy retencji, prawa osób.
- [ ] Regulamin aplikacji pacjenta.
- [ ] Wzorce treści zgód (art. 9, współopiekun, pacjent 18+).
- [ ] Polityka retencji: dane konta nieaktywnego, dane po wycofaniu zgody, logi dostępu, kopie zapasowe.
- [ ] Wersja robocza DPIA (art. 35) przed wpuszczeniem prawdziwych rodzin; aktualizacja po wdrożeniu zabezpieczeń.
- [ ] Potwierdzenie przez fundację uzasadnienia braku IOD (art. 37) — obecnie tylko w opisie.
- [ ] Zapis wprost o progu wieku użytkownika (art. 8 RODO, w Polsce 16 lat).
- [ ] Umowy / warunki powierzenia z dostawcami chmury i tożsamości (DPA Google Cloud, Firebase).
- [ ] Decyzja o danych do celów naukowych: anonimizacja (poza RODO) czy pseudonimizacja (odrębna zgoda + opis w polityce).
- [ ] Opinia MDR (osobny temat, ale warunkuje treści w aplikacji i polityce).

## Kolejność proponowana

1. Ekran zgód + zapis akceptacji.
2. Usuwanie konta z kasowaniem kaskadowym.
3. Polityka prywatności i retencja z prawnikiem.
4. Hardening API (docs, limity, upload).
5. Dziennik dostępu.
6. DPIA i potwierdzenie regionów.
