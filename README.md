# XNOVA

Barebone eines statischen Singleplayer-Weltraumspiels. Der lokale „Server“ läuft in einem Web Worker und persistiert Accounts sowie Sitzung in IndexedDB.

## Funktionen

- Registrierung mit E-Mail und Passwort
- Passwort-Hashing über PBKDF2/Web Crypto
- Login und lokale Sitzung
- Username-Vergabe nach dem ersten Login
- Begrüßungsansicht und Logout
- Unit-Tests, Browser-Test und Produktions-Build in GitHub Actions

## Lokal starten

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Sicherheitshinweis

Diese Architektur ist ausschließlich für den aktuellen Singleplayer-Prototyp gedacht. Web Worker und IndexedDB laufen vollständig im Browser des Spielers und sind kein vertrauenswürdiger Ersatz für einen echten Server. Für Multiplayer, serverseitige Spielregeln oder echte Accounts muss später ein externes Backend ergänzt werden.
