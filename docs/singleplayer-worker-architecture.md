# Singleplayer-Architektur mit Web Worker

## Ziel

Die erste spielbare Version benötigt keinen externen Server. Stattdessen kapselt ein Web Worker die serverähnliche Anwendungslogik und kommuniziert über ein kleines Request/Response-Protokoll mit der Benutzeroberfläche.

## Komponenten

1. **UI (`src/main.js`)**
   Rendert Formulare und Ansichten. Sie greift weder direkt auf IndexedDB noch auf Passwortdaten zu.
2. **Worker-Client (`src/client/worker-client.js`)**
   Ordnet jeder Anfrage eine ID zu und liefert Promise-basierte Antworten.
3. **Worker-Server (`src/worker/server.worker.js`)**
   Nimmt Aktionen entgegen, ruft die Domänenlogik auf und serialisiert Fehler.
4. **Auth-Domäne (`src/domain/auth-service.js`)**
   Enthält Registrierung, Login, Sitzung, Username-Vergabe und Logout ohne UI-Abhängigkeiten.
5. **Persistenz (`src/worker/indexed-db-store.js`)**
   Speichert Nutzer und aktuelle Sitzung lokal in IndexedDB.

## Worker-Protokoll

Anfrage:

```json
{ "id": 1, "action": "login", "payload": { "email": "...", "password": "..." } }
```

Erfolgreiche Antwort:

```json
{ "id": 1, "ok": true, "data": { "email": "...", "username": null } }
```

Fehler:

```json
{ "id": 1, "ok": false, "error": { "code": "INVALID_CREDENTIALS", "message": "..." } }
```

## Grenzen

Der Worker ist eine saubere Architekturgrenze, aber keine Sicherheitsgrenze. Spieler kontrollieren Browser, JavaScript und IndexedDB. Das Modell eignet sich für Singleplayer und frühe UI-/Gameplay-Prototypen, nicht für Multiplayer oder manipulationssichere Spielstände.

## Spätere Migration

Die UI kann den bestehenden Worker-Client später gegen einen HTTP-/WebSocket-Client austauschen. Die Aktionen und Antwortmodelle sollten dabei möglichst stabil bleiben. Die Domänenlogik kann in ein echtes Backend verschoben und durch PostgreSQL sowie serverseitige Sessions ergänzt werden.
