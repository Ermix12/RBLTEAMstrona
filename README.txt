RBL — REBEL TEAM / WERSJA SUPABASE CLOUD

PLIKI
- index.html
- style.css
- script.js
- data.js
- assets/rbl-logo.png

KONFIGURACJA SUPABASE
1. Otwórz Supabase SQL Editor.
2. Wklej cały plik supabase_setup.sql i kliknij Run.
3. Wejdź w Authentication → Providers → Email i wyłącz Confirm email.
   Strona mapuje nick gracza na techniczny adres w domenie .invalid,
   więc potwierdzenie e-mail nie jest używane.
4. W script.js ustaw prawdziwy SUPABASE_ANON_KEY w zmiennej SUPABASE_ANON_KEY.
   SUPABASE_URL jest już ustawiony.
5. Wgraj pliki na hosting statyczny (np. Vercel / Netlify) i uruchom przez HTTPS.
6. Zarejestruj konto, które ma być administratorem. W SQL Editor wykonaj:
   update public.users set role='admin', rank='Administrator'
   where username='TWOJ_NICK';
7. Zaloguj się ponownie na stronie. Panel Admina będzie dostępny dla tego konta.

WAŻNE
- Nie wklejaj klucza service_role do script.js ani do publicznego hostingu.
- Klucz anon/public jest przeznaczony do użycia w przeglądarce; bezpieczeństwo zapewnia RLS.
- Hasła obsługuje Supabase Auth. Nie zapisujemy haseł ani ich hashy we własnej tabeli.
- Profile i garaże są w public.users, katalog i zgłoszenia w public.decals,
  ranking w public.ranking. Zdjęcia trafiają do Storage bucket rbl-decals.
- Katalog, profile i ranking korzystają z Supabase Realtime.
- Początkowe 9 rekordów oklein jest dodawane przez skrypt SQL.
- Zlot jest ustawiony w script.js w stałej RALLY_DATE i RALLY_LOCATION.
- Paczka ID jest tymczasowa w bieżącej karcie przeglądarki; katalog, konta,
  garaże, kolejka i ranking są współdzielone w chmurze.
