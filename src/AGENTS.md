# UI-Regeln für Ressourcen-Icons

Diese Regeln gelten innerhalb von `src/` für UI-Rendering-Dateien, insbesondere `game-ui-*.js`, `ui-showcase.js` und die zugehörigen UI-Stylesheets.

## Verbindliche Ressourcendarstellung

- Für Metall, Kristall, Deuterium und Energie werden ausschließlich die kanonischen SVG-Icons unter `public/assets/icons/icon_resource_*.svg` verwendet.
- Sobald ein Ressourcenwert angezeigt wird – Bestand, Produktion, Kosten, Lagerkapazität, Verbrauch oder Energiebilanz – steht das passende Ressourcen-Icon sichtbar direkt beim Wert.
- Buchstaben-Platzhalter wie `M`, `K`, `D` oder `E`, Emojis und reine Textwerte sind kein Ersatz für die Ressourcen-Icons.
- UI-Code verwendet die zentralen Funktionen `resourceIconMarkup()` und `resourceValueMarkup()` aus `src/game-ui-format.js`; SVG-Markup oder Asset-Pfade werden nicht in einzelnen Komponenten dupliziert.
- Ist der Ressourcenname bereits als Text vorhanden, darf das Icon dekorativ mit `aria-hidden="true"` sein. Ohne sichtbaren Text benötigt das Icon einen zugänglichen Namen.
- Ressourcen-Icons werden überall ohne äußeren Rahmen, Hintergrundfläche oder Box-Shadow dargestellt.
- Auch umschließende Kosten- oder Badge-Elemente dürfen um Ressourcen-Icons keinen sichtbaren Rahmen oder farbigen Kasten erzeugen.
- Ressourcenfarben werden direkt am Icon erzwungen und dürfen nicht von umgebenden Text-, Effekt- oder Badge-Farben überschrieben werden.
- Metall wird in Rot (`#ff5d62`) dargestellt; Kristall, Deuterium und Energie behalten ihre festgelegten Ressourcenfarben.

## SVG-Stil

- ViewBox `0 0 24 24`, transparenter Hintergrund, reduzierte technische Outline-Geometrie.
- Einheitliche Strichstärke `1.75`, `currentColor`, keine Rasterbilder, Verläufe, Glows, Texte oder eingebetteten Fonts.
- Die Hauptform muss bei 16×16 px klar erkennbar bleiben.
