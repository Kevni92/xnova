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

## Veröffentlichung mit GitHub Pages

Pull Requests werden automatisch getestet. Nach einem Merge nach `main` führt der Workflow erneut Unit-Tests, Browser-Test und Produktions-Build aus. Nur wenn alle Schritte erfolgreich sind, wird der Inhalt aus `dist` auf GitHub Pages veröffentlicht.

Öffentliche Projektadresse:

`https://kevni92.github.io/xnova/`

Einmalige GitHub-Einstellung:

1. Das Repository muss bei GitHub Free öffentlich sein.
2. Unter **Settings → Pages → Build and deployment → Source** muss **GitHub Actions** ausgewählt werden.
3. Danach einen Merge nach `main` durchführen oder den Workflow **GitHub Pages** unter **Actions** manuell starten.

## Sicherheitshinweis

Diese Architektur ist ausschließlich für den aktuellen Singleplayer-Prototyp gedacht. Web Worker und IndexedDB laufen vollständig im Browser des Spielers und sind kein vertrauenswürdiger Ersatz für einen echten Server. Für Multiplayer, serverseitige Spielregeln oder echte Accounts muss später ein externes Backend ergänzt werden.
