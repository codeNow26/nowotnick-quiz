# Dynamische Quizze einrichten

## Was bleibt erhalten?

Die ursprüngliche Tabelle `public.quiz_data`, ihre Berechtigungen und die vier IDs bleiben unverändert:

| Quiz | ID |
| --- | --- |
| 1 | `2f167918-a027-44f0-a012-422e802a7bef` |
| 2 | `1dd72322-8420-43a8-a504-6665757232c6` |
| 3 | `6a14ed4b-febe-483e-bf11-8211daa4b947` |
| 4 | `ba7f1a27-2381-4c78-9967-e35679b112a8` |

Die Erweiterung verwendet `public.custom_quizzes`. Es gibt keine Migration der alten Datensätze. Alle Spiele verwenden dieselben Komponenten für Editor, Spielfeld, Antworten, Punkte, Sounds und Statistik. Die letzte Vorschau mit Nachlesen und Spielerfarben ist ebenfalls enthalten.

## Reihenfolge

1. Im Supabase-Projekt zur App den **SQL Editor** öffnen.
2. Als zusätzliche Sicherung im Table Editor `quiz_data` vollständig als CSV exportieren und lokal aufbewahren. Bilder werden als URLs referenziert; die Bilddateien selbst liegen weiterhin bei ihren bisherigen Anbietern.
3. Den vollständigen Inhalt von `supabase/migrations/20261112_dynamic_quizzes.sql` als **eine Abfrage** ausführen. Nicht einzelne Abschnitte getrennt starten.
4. Das Skript prüft die vier IDs, sichert zuerst alle vollständigen Datensätze in `quiz_backups.legacy_before_dynamic_v1` und erstellt erst danach die neue Tabelle. Alles läuft in einer Transaktion. Bei einem Fehler wird alles zurückgerollt. Die Sicherung ist für öffentliche API-Nutzer gesperrt und darf nicht als API-Schema freigegeben werden.
5. Die Abfrage unten ausführen. Direkt nach dem ersten Skriptlauf muss für alle vier Quizze `unveraendert = true` erscheinen. Das Skript nicht erneut ausführen, wenn `custom_quizzes` bereits existiert. In diesem Fall nichts löschen, sondern den vorhandenen Aufbau prüfen.
6. Vorschau testen: Quiz 2 öffnen und insbesondere Fragen, Antworten und Bilder prüfen. Zwei neue Testquizze erstellen und die unten aufgeführten Tests durchführen.
7. Erst danach den Pull Request nach `main` mergen. Vercel veröffentlicht wie bisher automatisch. An den Vercel-Umgebungsvariablen ist keine Änderung nötig.

```sql
SELECT q.id,
       q.data = b.row_data->'data' AS unveraendert,
       jsonb_array_length(q.data->'categories') AS kategorien,
       md5(q.data::text) AS aktueller_fingerabdruck,
       md5((b.row_data->'data')::text) AS sicherungs_fingerabdruck
FROM public.quiz_data q
JOIN quiz_backups.legacy_before_dynamic_v1 b ON b.id = q.id
ORDER BY q.id;
```

Die Sicherung zum zusätzlichen Download: `SELECT * FROM quiz_backups.legacy_before_dynamic_v1;` im SQL Editor ausführen und das Ergebnis exportieren. Sie enthält die kompletten ursprünglichen Zeilen. Bei späteren absichtlichen Bearbeitungen darf der Vergleich natürlich abweichen. Eine Wiederherstellung sollte gezielt je ID und erst nach Prüfung erfolgen, nicht pauschal über alle Quizze.

## Verhalten

- `/` zeigt weiterhin nur Quiz 1–4 und die Schaltflächen zum Erstellen und Verwalten.
- Neue Quizze: `/quiz/<name>`, Bearbeitung direkt über `/quiz/<name>?edit=true`.
- Gleiche Namen bekommen `-2`, `-3` usw. Die Datenbank erzwingt eindeutige Slugs auch bei gleichzeitiger Erstellung.
- Umbenennen verändert den Titel, nicht den Link. Duplizieren erstellt eine unabhängige Kopie einschließlich aller Datenfelder und Bildverweise.
- `/verwaltung` zeigt neue Quizze geräteübergreifend, mit Suche und Seitenwechsel. Archivierte Quizze stehen im Archiv und bleiben über ihren Link erreichbar.
- Löschen verlangt die Texteingabe `LÖSCHEN`. Nur Datensätze der neuen Tabelle können hier gelöscht werden.
- Es gibt **keine Anmeldung und keinen Schutz der Verwaltung**. Jeder Besucher kann neue Quizze sehen, bearbeiten, duplizieren oder löschen. „Nicht auf der Startseite“ bedeutet nicht privat. Ein späteres Login kann über Eigentümerfelder und RLS-Policies ergänzt werden.
- Ladevorgänge schreiben niemals Standarddaten zurück. Fehlschlagende Speicherungen bleiben sichtbar im Editor; Änderungen werden erst nach erfolgreichem Speichern übernommen. Ein Versionsvergleich verhindert unbemerktes Überschreiben gleichzeitiger Bearbeitungen.
- Titel und Kategorien werden mit einer gemeinsamen Anfrage gespeichert. Zusätzliche unbekannte Einstellungen im Datenobjekt bleiben erhalten.

## Deployment und Direktlinks

TanStack Start/Nitro erzeugt die Vercel-Serverroute selbst. Der bisherige pauschale Rewrite auf `/index.html` wurde entfernt: Er passt nicht zum Server-Routing und würde direkte Quiz-URLs abfangen. `vercel.json` ist deshalb leer (`{}`). Der Build erzeugt einen Filesystem-Handler für Assets und anschließend `/__server` für Seiten. Eine neue Abhängigkeit ist nicht nötig.

## Prüfliste nach Ausführung des SQL

- Quiz 1–4 öffnen; Quiz 2 unverändert mit seinen bisherigen Bildern und Antworten prüfen.
- Zwei neue Quizze mit identischem Namen erstellen: unterschiedliche URLs, keine zusätzlichen Startseiten-Kacheln.
- In Quiz A normale, Hinweis-, Reihenfolge- und ABCD-Fragen einschließlich Bildern und Zeilenumbrüchen speichern. Quiz B darf sich nicht verändern.
- A per direktem Link in einem neuen Tab öffnen und neu laden; danach auf einem zweiten Gerät öffnen.
- A in zwei Tabs bearbeiten. Nach dem ersten Speichern muss das zweite Speichern einen Konflikt melden und den Entwurf erhalten.
- A umbenennen: der alte Link bleibt gültig. A duplizieren, Kopie ändern und Original vergleichen.
- Archivieren: Eintrag verschwindet unter „Aktiv“, URL bleibt nutzbar. Wiederherstellen, dann eine entbehrliche Testkopie mit Bestätigung löschen.
- Falsche URL: verständlicher Fehler, kein Wechsel auf Quiz 1, kein Datenbank-Schreibzugriff.
- Spielfunktionen im neuen Quiz durchspielen: Timer, Punkte, Statistik, Nachlesen und Spielerfarben.

## Stand der automatisierten Prüfung

Siehe PR-Beschreibung und `tests/dynamic-quizzes.test.ts`. Die neue Datenbanktabelle muss erst vom Projektinhaber per SQL eingerichtet werden. Tests mit isolierter Supabase-Nachbildung ersetzen deshalb noch keinen Live-End-to-End-Test nach der Einrichtung. Es wurden während der Umsetzung keine vorhandenen Quizdaten verändert.

Geprüft während der Umsetzung: Alle vier Live-Datensätze wurden zu Beginn und am Ende ausschließlich gelesen und vollständig verglichen (inklusive `updated_at`). Alle vier waren unverändert. Quiz 2 enthielt 10 Kategorien, 50 Fragen und 5 Bildverweise. TypeScript-Check, Produktionsbuild und die isolierten Datenzugriffstests waren erfolgreich. Ein echter Browser-End-to-End-Test konnte in der Arbeitsumgebung nicht gestartet werden und bleibt vor der Veröffentlichung nachzuholen.

Tests lokal: `npm run test:quizzes` (Node 22.15 oder neuer), `npx tsc --noEmit`, `npm run build`. Die bestehende Lockdatei wurde nicht verändert.
