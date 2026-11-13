# Editor-Sicherung und Darstellung

Für diese Erweiterung sind keine SQL-Migrationen erforderlich. Die bestehenden vier Quiz-IDs und die Trennung zwischen `quiz_data` und `custom_quizzes` bleiben erhalten.

## Automatisches Speichern

Jede Eingabe erzeugt sofort einen lokalen Entwurf. Nach 1,5 Sekunden ohne Eingabe erfolgt die Speicherung bei Supabase. Manuelles Speichern bleibt möglich. Der Status zeigt die lokale Sicherung, laufende Synchronisierung und Fehler an.

Textänderungen werden synchron in einem kleinen LocalStorage-Journal gesichert und anschließend in IndexedDB geschrieben. Eingebettete Bilder werden vor ihrer Übernahme im Editor in IndexedDB gespeichert und über ihren SHA-256-Hash referenziert. Dadurch müssen große Bilder nicht bei jedem Tastendruck in LocalStorage kopiert werden. Externe Bild-URLs bleiben URLs; die Verfügbarkeit fremder Bildserver wird dadurch nicht garantiert.

Entwürfe sind nach Tabelle, Quiz-ID und Editor-Sitzung getrennt. Beim erneuten Öffnen werden abweichende lokale Entwürfe zur Wiederherstellung angeboten. Die Entscheidung für den Online-Stand behält diese Entwürfe, bis sie ausdrücklich verworfen werden. Ein zwischenzeitlich geänderter Online-Stand pausiert die Synchronisierung; dessen Ersetzen verlangt eine ausdrückliche Bestätigung. Die vorhandene Versionsprüfung schützt auch danach gegen weitere Änderungen.

Speicheranfragen laufen nacheinander. Eine ältere Antwort vom Server setzt neuere Eingaben nicht zurück. Bei Verbindungsproblemen bleibt der Entwurf erhalten; erneute Eingaben, die manuelle Speicherfunktion oder das Online-Ereignis versuchen die Synchronisierung erneut. Anfragen haben einen Timeout von 20 Sekunden.

Lokale Entwürfe gehören zum jeweiligen Browser und zur Domain (eine Vorschau und die Live-Seite haben getrennte lokale Speicher). Erst synchronisierte Inhalte sind auf anderen Geräten verfügbar. Browserdaten löschen entfernt auch Entwürfe. Wenn die lokale Sicherung blockiert oder voll ist, zeigt der Editor einen Fehler und bietet JSON-Export an. Ein noch laufender Bildimport wird beim Verlassen gesondert berücksichtigt. Die App wird dadurch nicht zu einer vollständig offline ladbaren Anwendung.

## Farben und Effekte

In der Spielvorbereitung lassen sich acht Farben auswählen. Bereits von aktiven Spielern gewählte Farben sind gesperrt. Namen, Farben und Spielerzahl werden lokal gemerkt. Die gewählten Farben erscheinen in Punktestand, Frageansicht und beantworteten Karten.

Unbeantwortete Karten erhalten auf Geräten mit Maus eine kleine Anhebung, weichen Glow und einen einmaligen Randschimmer. Beantwortete Karten behalten ihre ruhige Darstellung. Die Frageansicht öffnet mit einer kurzen Animation. `prefers-reduced-motion` deaktiviert die Bewegung.

Die Lichtschleier und Sterne wurden anschließend überarbeitet; aktuelles Verhalten siehe `VISUAL_POLISH.md`. Der Hintergrund ist standardmäßig aktiv und hat keinen Schalter mehr.

## Prüfung

- `npm run test:quizzes`: bestehende dynamische Quiz-Verwaltung und Versionsschutz.
- `npm run test:autosave`: sofortige lokale Sicherung, Debounce, Offline-Fehler, Wiederherstellung, Quiz-Trennung, Konfliktbehandlung, serielle Anfragen, verspätete Antworten, Verlassen während des Speicherns und eindeutige Spielerfarben.
- `npx tsc --noEmit` und `npm run build`.
- Zusätzlich wurde der IndexedDB-Adapter mit einer 2,5-MB-Bilddatei, Journal-Wiederherstellung, Quota-Fallback und versionsgebundener Löschung geprüft.
- Die vier produktiven Legacy-Datensätze wurden vor und nach der Umsetzung ausschließlich gelesen und waren identisch, einschließlich Quiz 2. Tests schreiben keine produktiven Quiz-Daten.

Eine visuelle Prüfung auf echten Desktop-/Touch-Geräten steht noch aus; der Browserstart war in der Entwicklungsumgebung nicht möglich. Vor dem Zusammenführen bitte die Vorschau prüfen, insbesondere lange Fragen, Farbauswahl, Bildimport und Wiederherstellung nach Neuladen.
