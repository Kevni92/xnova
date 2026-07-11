# Entwicklungsplan: Browserbasiertes Weltraum-Strategiespiel

## 1. Zielbild

Ziel ist ein langlebiges, browserbasiertes Multiplayer-Strategiespiel mit asynchronem Fortschritt. Spieler bauen Planeten aus, erforschen Technologien, produzieren Flotten, handeln, schließen sich zu Allianzen zusammen und konkurrieren um Ranglistenplätze.

Das Spiel darf sich an bewährten Mechaniken klassischer Weltraum-Aufbauspiele orientieren, soll aber eine eigenständige Marke, eigene Texte, Grafiken, Namen, Formeln und Balancing-Regeln erhalten. Eine direkte Kopie geschützter Inhalte, Benutzeroberflächen oder Spieldaten ist nicht Bestandteil des Projekts.

## 2. Produktprinzipien

1. **Asynchron statt dauerhaft online:** Fortschritt läuft serverseitig über Zeitpunkte und Ereignisse.
2. **Nachvollziehbare Regeln:** Kosten, Dauer, Produktion und Kampfergebnisse müssen für Spieler erklärbar sein.
3. **Server ist autoritativ:** Der Client zeigt Daten an, entscheidet aber nie über Ressourcen, Kampf oder Bauzeiten.
4. **Spielbare frühe Version:** Zuerst ein geschlossener Gameplay-Kreislauf, danach soziale und komplexe Systeme.
5. **Eigenständiges Balancing:** Alle Formeln und Werte werden versioniert, getestet und unabhängig entwickelt.
6. **Mobile Nutzbarkeit:** Die Weboberfläche muss auf Desktop und Smartphone funktionieren.
7. **Betrieb vor Perfektion:** Monitoring, Backups, Migrationen und Admin-Werkzeuge gehören zum Kernprodukt.

## 3. Annahmen für die erste Version

- Ein Universum mit mehreren Galaxien und Systemen
- Ein Hauptplanet pro neuem Spieler
- Weitere Planeten durch Kolonisierung
- Persistente Welt ohne Rundenende
- Spielgeschwindigkeit als konfigurierbarer Universumswert
- Ressourcen: Metall, Kristall und Energie sowie optional ein späterer Spezialrohstoff
- Browser-Client mit responsivem Layout
- Zunächst ein modularer Monolith statt verteilter Microservices
- Deutsch und Englisch als vorbereitete, aber nicht zwingend sofort vollständige Sprachen

## 4. MVP-Umfang

### 4.1 Konten und Spielerprofil

- Registrierung, Anmeldung und Abmeldung
- Verifizierung der E-Mail-Adresse
- Passwort zurücksetzen
- Anzeigename und Basisprofil
- Sitzungsliste und Abmelden aller Geräte
- Sperren, Verwarnungen und Rollen für Administration

### 4.2 Universum und Planeten

- Automatische Vergabe eines Startplaneten
- Galaxie-, System- und Positionskoordinaten
- Planetengröße und nutzbare Felder
- Ressourcenlager und aktuelle Produktionswerte
- Bauplätze, Temperatur und grundlegende Planeteneigenschaften
- Übersicht über eigene Planeten

### 4.3 Gebäude

Erste Gebäudegruppen:

- Metallmine
- Kristallmine
- Energieanlage
- Metalllager
- Kristalllager
- Robotikzentrum
- Forschungszentrum
- Werft

Funktionen:

- Kosten- und Bauzeitberechnung
- Voraussetzungen
- Eine Bauwarteschlange je Planet
- Abbruch mit konfigurierbarer Rückerstattung
- Fertigstellung über serverseitige Ereignisse

### 4.4 Forschung

Erste Forschungsbereiche:

- Energietechnik
- Antriebstechnik
- Computertechnik
- Spionagetechnik
- Waffen-, Schild- und Panzerungstechnik
- Astrophysik beziehungsweise Kolonisierungstechnik

Funktionen:

- Globale Forschungsstände je Spieler
- Eine Forschungswarteschlange je Spieler
- Forschungszeiten abhängig von Laborstufen und Universumsfaktor
- Voraussetzungen für Schiffe und Gebäude

### 4.5 Werft, Schiffe und Verteidigung

Erste Einheiten:

- Kleiner Transporter
- Großer Transporter
- Leichter Jäger
- Schwerer Jäger
- Aufklärungssonde
- Kolonieschiff
- Kleiner Frachter beziehungsweise Sammler
- Einfache Boden- oder Orbitalverteidigung

Funktionen:

- Produktionswarteschlange
- Stapelproduktion
- Kapazität, Geschwindigkeit, Verbrauch und Kampfdaten
- Fertigstellung in mehreren Losen

### 4.6 Flottenmissionen

MVP-Missionen:

- Transport
- Stationierung
- Angriff
- Spionage
- Kolonisierung
- Rückruf einer laufenden Flotte

Erforderliche Funktionen:

- Serverseitige Prüfung aller Voraussetzungen
- Flugzeit- und Treibstoffberechnung
- Reservierung der Schiffe beim Start
- Hin- und Rückflug als getrennte Ereignisse
- Ergebnisbericht im Nachrichtensystem
- Sichere Behandlung gleichzeitig eintreffender Flotten

### 4.7 Kampf

- Rundenbasiertes, deterministisch reproduzierbares Kampfsystem
- Waffen-, Schild- und Hüllenwerte
- Zielauswahl über klar definierte Zufallsquelle
- Konfigurierbare maximale Rundenzahl
- Sieg, Niederlage oder Unentschieden
- Verluste, Beute und optionales Trümmerfeld
- Vollständiger Kampfbericht mit gekürzter Standardansicht
- Speicherung der verwendeten Balancing-Version

### 4.8 Nachrichten und Berichte

- Systemnachrichten
- Transportberichte
- Spionageberichte
- Kampfberichte
- Kolonisierungsberichte
- Gelesen/Ungelesen
- Archivieren und Löschen
- Aufbewahrungsregeln für alte Nachrichten

### 4.9 Rangliste

- Punkte für Gebäude, Forschung und Flotte
- Gesamtpunkte
- Regelmäßige oder ereignisbasierte Aktualisierung
- Schutz vor Informationslecks durch zu genaue Live-Daten

## 5. Nicht Bestandteil des ersten MVP

- Allianzkriege und komplexe Diplomatie
- Marktplatz oder Auktionshaus
- Premiumwährung
- Mobile Apps
- Mehrere Universen mit unterschiedlichen Regelwerken
- Monde, Sprungtore und sehr komplexe Spezialmissionen
- Automatisierte Turniere oder saisonale Universen
- Umfangreiche NPC-Fraktionen
- Live-Chat
- Öffentliches Modding

Diese Punkte werden erst begonnen, wenn der Kernkreislauf stabil und messbar ist.

## 6. Empfohlener Technologie-Stack

### 6.1 Frontend

- **Next.js mit TypeScript**
- React Server Components nur dort, wo sie den Datenfluss vereinfachen
- Client-Komponenten für Timer, Formulare und interaktive Flottenplanung
- TanStack Query oder eine vergleichbare Lösung für Client-Caching
- Komponentenbibliothek mit eigenem Theme
- Internationalisierung von Beginn an vorbereiten

### 6.2 Backend

- **NestJS mit TypeScript** als API und Domänenanwendung
- REST-API für Kernfunktionen
- WebSocket oder Server-Sent Events nur für Komfortaktualisierungen, nicht als Voraussetzung für korrekten Spielzustand
- OpenAPI-Spezifikation
- Hintergrundjobs über BullMQ oder eine vergleichbare Queue

Alternativ kann das Projekt als Next.js-Anwendung mit klar getrennten Domänenmodulen beginnen. Für langfristige Wartbarkeit ist ein separates Backend jedoch vorzuziehen.

### 6.3 Datenhaltung

- **PostgreSQL** als primäre Datenbank
- **Redis** für Queue, kurzlebige Locks, Rate Limits und Cache
- Objektspeicher für große Berichte oder spätere Medieninhalte
- Regelmäßige verschlüsselte Backups

### 6.4 Betrieb

- Docker für lokale Entwicklung und Deployment
- Docker Compose für die erste lokale Umgebung
- CI über GitHub Actions
- Staging- und Produktionsumgebung
- Reverse Proxy und TLS
- Strukturierte Logs, Metriken und Fehlerüberwachung

## 7. Zielarchitektur

Für die erste Produktionsversion wird ein modularer Monolith empfohlen. Die Module haben eigene Services, Repositories, Ereignisse und Tests, laufen aber in einer Anwendung und einer Datenbank.

### Kernmodule

- `identity`: Benutzer, Sitzungen, Rollen und Sperren
- `universe`: Galaxien, Systeme, Positionen und Universumsregeln
- `players`: Spielerprofil, Einstellungen und Punkte
- `planets`: Planeten, Felder, Temperatur und Besitz
- `economy`: Produktion, Lagerung und Ressourcentransaktionen
- `buildings`: Gebäude, Voraussetzungen und Bauwarteschlangen
- `research`: Forschung und Forschungswarteschlange
- `shipyard`: Schiffe, Verteidigung und Produktion
- `fleets`: Flotten, Missionen, Flugzeiten und Rückruf
- `combat`: Kampfsimulation, Beute und Verluste
- `reports`: Nachrichten und Spielberichte
- `rankings`: Punkte und Ranglisten
- `admin`: Moderation, Konfiguration und Audit-Protokoll

### Architekturregeln

- Domänenmodule greifen nicht direkt auf Tabellen anderer Module zu.
- Änderungen an Ressourcen erfolgen ausschließlich über transaktionale Domänendienste.
- Zeitgesteuerte Aktionen speichern einen absoluten Fertigstellungszeitpunkt.
- Hintergrundjobs dürfen wiederholt ausgeführt werden, ohne Ergebnisse zu duplizieren.
- Kritische Aktionen werden in Datenbanktransaktionen ausgeführt.
- Jede relevante Spielaktion erhält eine eindeutige ID und einen Audit-Eintrag.

## 8. Zeit- und Ereignismodell

Das Spiel darf nicht von ständig laufenden Sekunden-Tickern abhängig sein.

### Grundprinzip

1. Beim Start einer Aktion wird der Zielzeitpunkt berechnet und gespeichert.
2. Ein Queue-Job wird für diesen Zeitpunkt geplant.
3. Beim Öffnen einer Ansicht wird der aktuelle Zustand zusätzlich aus Zeitpunkten berechnet.
4. Ein periodischer Reparaturprozess sucht überfällige Aktionen und verarbeitet sie nachträglich.
5. Jeder Handler ist idempotent und kann nach einem Neustart erneut laufen.

### Beispiele für Ereignisse

- `building.started`
- `building.completed`
- `research.started`
- `research.completed`
- `shipyard.batch.completed`
- `fleet.departed`
- `fleet.arrived`
- `fleet.returned`
- `combat.resolved`
- `planet.colonized`

## 9. Wirtschaft und Balancing

Alle Balancing-Werte gehören in versionierte Konfigurationen und nicht als verstreute Konstanten in den Code.

### Zu konfigurierende Werte

- Gebäudebasiskosten und Wachstumsfaktoren
- Basisproduktion je Mine und Stufe
- Energieverbrauch und Energieproduktion
- Lagerkapazitäten
- Bau- und Forschungszeitfaktoren
- Schiffswerte, Verbrauch und Geschwindigkeit
- Beutegrenzen
- Punkteberechnung
- Universumsgeschwindigkeit
- Schutzregeln für neue Spieler

### Ressourcenberechnung

- Ressourcen werden bei Bedarf aus `letzte_berechnung`, Produktionsrate und aktueller Zeit berechnet.
- Vor jeder Ausgabe wird die Produktion materialisiert und innerhalb derselben Transaktion gespeichert.
- Lagergrenzen werden bei der Gutschrift berücksichtigt.
- Keine Ressource darf durch Rundung oder Nebenläufigkeit negativ werden.
- Für alle Ressourcentransaktionen wird ein Ledger empfohlen.

### Balancing-Prozess

1. Formeln schriftlich dokumentieren.
2. Referenzsimulationen für frühe, mittlere und späte Spielphase erstellen.
3. Grenzwerte und Extremfälle automatisiert testen.
4. Änderungen mit Versionsnummer veröffentlichen.
5. Bestehende Flüge und Kämpfe mit der beim Start gültigen Version auswerten.

## 10. Vorläufiges Datenmodell

### Zentrale Tabellen beziehungsweise Aggregate

- `users`
- `sessions`
- `players`
- `universes`
- `galaxies`
- `systems`
- `planets`
- `planet_resources`
- `planet_buildings`
- `player_research`
- `ship_definitions`
- `planet_ships`
- `build_queues`
- `research_queues`
- `shipyard_queues`
- `fleets`
- `fleet_units`
- `fleet_missions`
- `combat_reports`
- `messages`
- `rankings`
- `resource_ledger`
- `game_events`
- `audit_logs`

### Wichtige technische Felder

- UUID als öffentliche ID
- Zeitstempel in UTC
- Optimistische Versionsnummer für kritische Aggregate
- Statusfelder mit Datenbank-Constraints
- Eindeutige Constraints für Koordinaten und aktive Warteschlangen
- Soft Delete nur dort, wo fachlich erforderlich

## 11. API-Schnittstellen

### Konten

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/password-reset`

### Planet und Wirtschaft

- `GET /planets`
- `GET /planets/{planetId}`
- `GET /planets/{planetId}/economy`
- `GET /planets/{planetId}/buildings`
- `POST /planets/{planetId}/buildings/{buildingKey}/upgrade`
- `DELETE /planets/{planetId}/building-queue/current`

### Forschung und Werft

- `GET /research`
- `POST /research/{researchKey}`
- `GET /planets/{planetId}/shipyard`
- `POST /planets/{planetId}/shipyard/orders`

### Flotten

- `POST /fleets/preview`
- `POST /fleets`
- `GET /fleets`
- `POST /fleets/{fleetId}/recall`

### Berichte und Rangliste

- `GET /messages`
- `GET /reports/{reportId}`
- `GET /rankings/players`

Alle schreibenden Endpunkte benötigen Idempotency Keys oder eine gleichwertige Absicherung gegen doppelte Requests.

## 12. Sicherheit und Anti-Cheat

### Anwendungssicherheit

- Sichere Passwort-Hashes mit Argon2id
- Kurze Zugriffstoken und rotierende Refresh-Tokens
- CSRF-Schutz bei Cookie-basierten Sitzungen
- Eingabevalidierung auf API-Ebene und in der Domäne
- Content Security Policy und sichere HTTP-Header
- Rate Limits für Login, Spionage, Nachrichten und Flottenstarts
- Keine internen IDs oder geheimen Informationen in Fehlermeldungen

### Spielintegrität

- Alle Kosten und Zeiten werden serverseitig berechnet.
- Keine Vertrauensannahmen gegenüber Client-Timern.
- Schutz vor Replay- und Doppel-Requests.
- Audit-Protokoll für Ressourcen, Flotten und Admin-Aktionen.
- Erkennung auffälliger Request-Raten und wiederholter Muster.
- Konfigurierbare Regeln gegen Multi-Accounting und automatisierte Bots.
- Admin-Aktionen sind sichtbar, begründet und nachvollziehbar.

## 13. Tests

### Unit-Tests

- Kostenformeln
- Produktionsberechnung
- Lagergrenzen
- Voraussetzungen
- Flugzeit und Verbrauch
- Kampfrunden
- Punkteberechnung

### Integrationstests

- Ressourcen ausgeben und Warteschlange starten
- Gleichzeitige Bauanfragen
- Flottenstart mit parallelen Requests
- Ankunft und Rückflug
- Kampf und Beute in einer Transaktion
- Wiederholung eines bereits verarbeiteten Jobs

### End-to-End-Tests

- Registrierung bis erster Gebäudeausbau
- Forschung freischalten und Schiff bauen
- Transport zwischen zwei Planeten
- Angriff mit Bericht
- Kolonisierung eines freien Platzes

### Last- und Simulationstests

- Viele gleichzeitig fällige Bauaktionen
- Massenankünfte von Flotten
- Ranglistenberechnung
- Galaxieansicht mit hoher Spielerzahl
- Mehrtägige simulierte Universumsentwicklung

## 14. Beobachtbarkeit und Betrieb

### Metriken

- Aktive Spieler pro Tag und Woche
- Registrierungen und Aktivierungsrate
- Warteschlangenlänge und Job-Verzögerung
- Fehlgeschlagene Ereignisse
- Datenbanklatenz
- API-Latenz nach Route
- Anzahl gestarteter und abgeschlossener Flotten
- Ressourcenmenge im gesamten Universum

### Betriebsfunktionen

- Health- und Readiness-Endpunkte
- Dead-Letter-Queue für fehlgeschlagene Jobs
- Reparaturjob für überfällige Ereignisse
- Datenbankmigrationen mit Rollback-Plan
- Tägliche Backups und regelmäßige Restore-Tests
- Wartungsmodus
- Admin-Ansicht für Spieler, Planeten, Flotten und Ereignisse

## 15. Empfohlene Repository-Struktur

```text
apps/
  web/
  api/
packages/
  game-config/
  game-engine/
  shared-types/
  ui/
infra/
  docker/
  migrations/
docs/
  architecture/
  game-design/
  operations/
  decisions/
tests/
  simulations/
```

Der eigentliche Game-Engine-Code sollte keine Abhängigkeit von HTTP, Datenbank oder UI besitzen. Dadurch lassen sich Formeln, Kampf und Simulationen schnell und deterministisch testen.

## 16. Umsetzungsphasen

### Phase 0 – Grundlagen

**Ziel:** Entwicklungsumgebung und technische Leitplanken stehen.

- Monorepo einrichten
- TypeScript, Linting und Formatierung
- Docker Compose mit PostgreSQL und Redis
- CI mit Build, Tests und Migrationstest
- Grundlegende Architekturentscheidungen dokumentieren
- Konfigurationsschema für Universums- und Balancing-Werte

**Abnahmekriterien:**

- Ein neuer Entwickler kann das Projekt mit einem dokumentierten Befehl starten.
- CI läuft bei jedem Pull Request.
- Eine Beispielmigration kann lokal und in CI ausgeführt werden.

### Phase 1 – Konto, Universum und Startplanet

**Ziel:** Ein Spieler kann sich registrieren und erhält einen Planeten.

- Authentifizierung
- Spielerprofil
- Universumskoordinaten
- Startplanet-Vergabe
- Basisnavigation im Frontend
- Admin-Sperre und Audit-Log

**Abnahmekriterien:**

- Registrierung und Login funktionieren Ende-zu-Ende.
- Zwei Spieler erhalten niemals dieselbe Position.
- Gesperrte Konten können keine Spielaktionen ausführen.

### Phase 2 – Wirtschaft und Gebäude

**Ziel:** Der erste vollständige Fortschrittskreislauf ist spielbar.

- Ressourcenproduktion
- Energie und Lager
- Gebäudedefinitionen
- Voraussetzungen
- Bauwarteschlange
- Fertigstellungsjobs
- Produktionsübersicht

**Abnahmekriterien:**

- Ressourcen stimmen nach Browser-Neuladen und Serverneustart.
- Doppelte Requests erzeugen keinen doppelten Bauauftrag.
- Überfällige Aufträge werden automatisch repariert.

### Phase 3 – Forschung und Werft

**Ziel:** Spieler können neue Möglichkeiten freischalten und Einheiten produzieren.

- Forschungsbaum
- Forschungswarteschlange
- Schiffswerte
- Werftaufträge
- Verteidigungseinheiten
- Punkteberechnung

**Abnahmekriterien:**

- Voraussetzungen werden ausschließlich serverseitig geprüft.
- Produktionslose werden korrekt und idempotent fertiggestellt.
- Ranglistenpunkte entsprechen den dokumentierten Regeln.

### Phase 4 – Flotten und Galaxie

**Ziel:** Interaktion zwischen Planeten wird möglich.

- Galaxieansicht
- Flottenzusammenstellung
- Flugzeit und Verbrauch
- Transport und Stationierung
- Spionage
- Rückruf
- Berichte

**Abnahmekriterien:**

- Schiffe können während eines Flugs nicht anderweitig genutzt werden.
- Ankunft und Rückflug funktionieren nach Serverneustarts.
- Gleichzeitige Flottenaktionen beschädigen keine Bestände.

### Phase 5 – Kampf und Kolonisierung

**Ziel:** Der zentrale Wettbewerbskreislauf ist vollständig.

- Kampfsimulator
- Angriffsmission
- Beute
- Verluste und Trümmer
- Kolonieschiff und neue Planeten
- Schutzregeln für neue Spieler
- Ausführliche Berichte

**Abnahmekriterien:**

- Kämpfe sind mit gleichem Seed reproduzierbar.
- Kein Kampf kann Ressourcen oder Schiffe duplizieren.
- Kolonisierung ist atomar und verhindert doppelte Belegung.

### Phase 6 – Geschlossene Alpha

**Ziel:** Stabilität, Bedienbarkeit und Balancing werden mit echten Spielern geprüft.

- Admin-Dashboard
- Telemetrie und Fehlerüberwachung
- Feedback-Funktion
- Balancing-Simulationen
- Lasttests
- Backup- und Restore-Test
- Datenschutz- und Nutzungsdokumente

**Abnahmekriterien:**

- Kritische Fehler werden überwacht und alarmiert.
- Restore aus einem Produktionsbackup wurde erfolgreich geprobt.
- Die wichtigsten Spielabläufe sind mobil nutzbar.

### Phase 7 – Beta und Erweiterungen

Nach stabiler Alpha:

- Allianzen
- Allianzrollen und gemeinsame Kommunikation
- Erweiterte Diplomatie
- Handels- oder Marktplatzsystem
- Monde und Spezialgebäude
- Mehrere Universen
- Saisonale Regeln
- Erweiterte Anti-Bot-Erkennung

## 17. Priorisiertes Backlog

### Priorität A – Unverzichtbar

1. Repository- und CI-Grundlage
2. Authentifizierung
3. Universum und Startplanet
4. Ressourcensystem
5. Gebäude und Bauwarteschlange
6. Forschung
7. Werft
8. Flottenbewegung
9. Kampf
10. Berichte
11. Administration und Audit
12. Backups und Monitoring

### Priorität B – Wichtig nach dem MVP

1. Allianzen
2. Erweiterte Ranglisten
3. Komfortbenachrichtigungen
4. Verbesserte Galaxiesuche
5. Mehrsprachigkeit
6. Spielinterne Tutorials
7. Balance-Dashboard

### Priorität C – Später

1. Saisonale Universen
2. NPC-Ereignisse
3. Mobile Apps
4. Modding-Schnittstellen
5. Öffentliche API

## 18. Zentrale Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Fehlerhafte Nebenläufigkeit | Ressourcen- oder Schiffsduplizierung | Transaktionen, Locks, Idempotency Keys und Belastungstests |
| Queue-Ausfall | Aktionen werden verspätet verarbeitet | Reparaturjob, persistente Jobs und idempotente Handler |
| Unkontrollierte Inflation | Unspielbare Wirtschaft | Simulationen, globale Metriken und versioniertes Balancing |
| Zu großer MVP | Späte erste spielbare Version | Klare Nicht-Ziele und phasenweise Abnahme |
| Botting und Multi-Accounting | Unfairer Wettbewerb | Rate Limits, Verhaltenssignale, Audit und Moderationswerkzeuge |
| Rechtliche Nähe zum Vorbild | Marken- oder Urheberrechtsprobleme | Eigene Marke, Texte, Assets, Formeln und Benutzeroberfläche |
| Fehlende Betriebswerkzeuge | Lange Ausfälle und manuelle Reparaturen | Monitoring, Admin-Ansicht, Backups und Runbooks |

## 19. Definition of Done

Eine Funktion gilt erst als abgeschlossen, wenn:

- fachliche Regeln dokumentiert sind,
- Servervalidierung vorhanden ist,
- Berechtigungen geprüft werden,
- Unit- und Integrationstests bestehen,
- Migrationen vorliegen,
- Fehlerfälle und Wiederholungen behandelt werden,
- Logs und relevante Metriken vorhanden sind,
- die Oberfläche auf Desktop und Smartphone nutzbar ist,
- keine fremden geschützten Assets oder Texte übernommen wurden,
- die Dokumentation aktualisiert wurde.

## 20. Erste konkrete Arbeitspakete

1. Architecture Decision Record für Monorepo, Datenbank und Queue anlegen.
2. Monorepo mit `apps/web`, `apps/api` und `packages/game-engine` initialisieren.
3. Lokale PostgreSQL- und Redis-Umgebung bereitstellen.
4. CI für Linting, Tests, Build und Migrationen einrichten.
5. Universums- und Balancing-Konfiguration als validiertes Schema definieren.
6. Authentifizierung und Spieleranlage implementieren.
7. Transaktionale Vergabe eines Startplaneten entwickeln.
8. Ressourcen-Ledger und zeitbasierte Produktionsberechnung implementieren.
9. Erste Gebäude und Bauwarteschlange umsetzen.
10. Simulationsskript für die ersten sieben Spieltage erstellen.

## 21. Erfolgskriterien für die erste spielbare Alpha

Die Alpha ist erreicht, wenn ein neuer Spieler ohne Admin-Eingriff:

1. ein Konto erstellen kann,
2. einen Startplaneten erhält,
3. Ressourcen produziert,
4. Gebäude ausbaut,
5. Forschung abschließt,
6. Schiffe baut,
7. einen anderen Planeten ausspioniert,
8. Ressourcen transportiert,
9. einen Angriff startet,
10. einen nachvollziehbaren Bericht erhält,
11. einen weiteren Planeten kolonisiert.

Zusätzlich müssen Serverneustarts, doppelte Requests und verspätete Queue-Jobs ohne Datenverlust oder Duplizierung verarbeitet werden.
