RBL / REBEL TEAM — V5 ICON & LAYOUT FIX

URUCHOMIENIE
1. Rozpakuj archiwum.
2. Otwórz folder RBL_REBEL_TEAM_V3 w Visual Studio Code.
3. Uruchom index.html przez rozszerzenie Live Server.

POPRAWKI V5
- Naprawiono pozycjonowanie przycisku Asystenta RBL: position: fixed pozostaje aktywne również po załadowaniu warstwy animacji.
- Wycentrowano logo w przycisku i avatarze czatu.
- Uporządkowano układ nagłówka czatu, przycisku zamykania, pola wiadomości i przycisku wysyłania.
- Dodano bezpieczne marginesy dla ekranów z wycięciami (safe-area) i małych ekranów.
- Okno czatu dopasowuje wysokość do viewportu, także w orientacji poziomej.
- Ujednolicono centrowanie ikon i minimalne pola klikalne przycisków.
- Poprawiono warstwy (z-index) czatu, modali i powiadomień.
- Zachowano oryginalne logo RBL i brak zewnętrznych grafik.

PANEL ADMINA
Hasło lokalne: rebel123

UWAGA TECHNICZNA
To statyczna strona front-end. Konta, ranking i moderacja zapisują się lokalnie w przeglądarce. Produkcyjne współdzielenie danych i prawdziwe Discord OAuth2 wymagają backendu oraz konfiguracji OAuth po stronie serwera.
