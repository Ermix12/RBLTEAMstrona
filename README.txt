
ZMIANY W TEJ WERSJI
- Karty oklein nie pokazują już wielkich numerów dekoracyjnych ani wewnętrznych identyfikatorów.
- Z karty usunięto widoczny tekst z numerem ID; przycisk kopiowania ID nadal działa.
- Motyw zmienia się płynnie po wybraniu opcji. Wybór działa w bieżącej sesji i nie jest zapisywany w localStorage.
- Zachowano logowanie kontem RBL, panel administracyjny, formularz zgłoszeń i moderację.

URUCHOMIENIE
1. Rozpakuj archiwum.
2. Wgraj zawartość folderu RBL_REBEL_TEAM_V3 do projektu Vercel lub uruchom index.html przez Live Server.

WAŻNE — WSPÓLNE DANE W HOSTINGU
Sam hosting statyczny (np. Vercel) nie jest bazą danych. W obecnej wersji istniejące konta, ranking, katalog i kolejka moderacji nadal korzystają z localStorage. Zmiana hostingu nie przeniesie tych danych między urządzeniami.
Żeby zgłoszenia wysyłane przez graczy trafiały do wspólnej kolejki widocznej dla administracji, trzeba podłączyć backend (np. Supabase: Auth + Database + Storage) i zabezpieczyć akcje moderatora po stronie serwera. Nie umieściłem klucza service_role ani hasła administratora w plikach front-endu — to byłoby publiczne i niebezpieczne.

Następny etap wdrożenia chmury wymaga utworzenia projektu Supabase i ustawienia zmiennych środowiskowych po stronie Vercel. Połączenie musi obejmować: użytkowników, katalog zatwierdzonych oklein, kolejkę zgłoszeń, pliki zdjęć i role administratorów.

COLOR MODE został usunięty. Strona używa jednego, spójnego fioletowego motywu.
