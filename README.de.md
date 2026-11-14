# 🔴 Connect Four – Vier gewinnt

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

Ein typsicheres Vier gewinnt (Connect Four) mit **React 18**, **Vite** und **TypeScript** – 7 × 6-Brett, fallende Steine mit Animation,
Zwei-Spieler-Modus und drei KI-Stufen, angetrieben von einem **Bitboard-Negamax mit α-β-Beschneidung, Transpositionstabelle und iterativer Vertiefung**.
Läuft eigenständig **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** –
spiele es unter [dulzoltan.hu/arcade/#/play/connect4](https://dulzoltan.hu/arcade/#/play/connect4).

[![CI](https://github.com/ZoliQua/Connect-Four-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Connect-Four-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhalt

- [Die Zoltan's-Arcade-Familie](#️-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Steuerung](#️-steuerung)
- [Auf dem Handy](#-auf-dem-handy)
- [Wertung & Statistik](#-wertung--statistik)
- [Automatisches Speichern & Fortsetzen](#-automatisches-speichern--fortsetzen)
- [Einbettung in Arcade-Game-Center](#-einbettung-in-arcade-game-center)
- [So funktioniert es](#-so-funktioniert-es)
- [Skripte](#-skripte)
- [Architektur](#️-architektur)
- [Mitwirken](#-mitwirken)
- [Lizenz](#️-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repo, das sich auch in das Portal einklinkt. Sie teilen sich ein Designsystem, ein Wertungsmodell und ein Speicherformat über das eingebundene Kit [`src/arcade/`](./src/arcade).

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistiken, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 **Connect Four** (dieses Repo) | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 🔴 **Klassisches 7 × 6-Vier-gewinnt** – Steine fallen sanft in das unterste freie Loch (CSS-Transform; bei reduzierter Bewegung aus)
- 🎮 **Vier Modi** – Spieler gegen Spieler, Leicht, Mittel (Standard) und Schwer; die KI-Modi werden gewertet
- 🧠 **Echte Suchmaschine als KI** – Bitboard-Negamax, α-β-Beschneidung, Transpositionstabelle, Beschneidung auf „nicht verlierende Züge“, Fenster-Heuristik;
  Schwer vertieft iterativ auf 10+ Halbzüge (typisch 15–22) in ~450 ms und löst Endspiele vollständig
- 👆 **Hover- / Tastatur-Vorschau** – ein Geisterstein zeigt, wohin dein Einwurf geht; die gewinnenden vier (oder fünf …) leuchten, der Rest wird abgedunkelt
- 🏆 **Einheitliche Arcade-Wertung** – jede Runde wird mit der gemeinsamen Duell-Formel gewertet; Bestwert, Spielzahl und Siege werden mit dem Portal geteilt
- 📊 **Serien-Anzeigetafel** – Du / KI / Unentschieden (im PvP Rot / Gelb / Unentschieden) plus Seriepunkte
- 🔄 **Verlierer beginnt** – der Verlierer der vorigen Runde eröffnet die nächste (bei Unentschieden und abgebrochenen Runden wechselt der Anfang)
- 📖 **Regeln-Dialog** – Ziel, Spielablauf, Regeln, die echten Punktebereiche und ein Diagramm (über den Knopf **Regeln**; beim Öffnen pausiert die Runde)
- 🏁 **Vorzeitig beenden** – beendet nach einer Bestätigung das ganze Spiel und wertet den Punktestand der aktuellen Runde (0, bis die Runde entschieden ist; im PvP ungewertet)
- 📱 **Handytauglich** – tippe irgendwo in eine Spalte, und der Stein fällt hinein; kein Doppeltippen, kein Scrollen oder Zoomen der Seite auf dem Brett; ein Knopf **Vollbild** blendet die Browserleisten aus
- ⏸️ **Pause** (P / Esc oder automatisch, wenn der Tab verborgen wird) – friert Brett, KI und Rundenzeit ein
- 💾 **Automatisches Speichern & Fortsetzen** – die ganze Serie (Brett, Ergebnisse, Punkte, Modus) übersteht Neuladen und Tab-Schließen
- ⚡ **KI-Verzögerung** – sofort / 0,15 s / 0,4 s / 1 s Bedenkzeit, wird gemerkt
- 🌗 **Dunkles / helles Design**, geteilt mit jedem Arcade-Spiel (Taste **T**)
- 🌍 **Drei Sprachen** – Englisch, Ungarisch und Deutsch; umschaltbar in der oberen Leiste oder in den Einstellungen (für Links auch `?lang=en|hu|de`); Zahlen folgen der Gruppierung der Sprache
- 🦷 **Zahnmodus** – ein Schalter „Fogas mód“ / "Dental mode" / „Zahnmodus“ in den Einstellungen, standardmäßig aus (oder `?dental=1`), im ganzen Arcade geteilt: die Steine sind Zähne, Schneidezahn- gegen Backenzahn-Silhouetten (Form, nicht nur Farbe); nur Darstellung
- 🤖 **Demo-Modus** (`<ConnectFourDemo />`) – zwei flache, leicht zufällige KIs spielen auf der echten Engine auf der Startseite des Portals
- ⌨️ **Tastaturorientiert und barrierearm** – Spalten sind echte Buttons mit `aria-label`, sichtbarer Fokus, wandernder Fokus;
  Tastenkürzel werden ignoriert, solange du in ein Formularfeld tippst oder Cmd/Strg/Alt gedrückt hältst
- 🧪 **Getestet** – Regeln, Bitboard-gegen-Array-Kreuzprüfungen, exakte Endspiellösung gegen schlichtes Minimax, KI-Taktik, Wertung,
  der Speicher-Validator, die Demo und das Verhalten der Komponenten

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Connect-Four-Game.git
cd Connect-Four-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Pfade, daher kann `dist/` aus jedem Unterordner ausgeliefert werden.

## ⌨️ Steuerung

| Taste | Aktion |
| --- | --- |
| 🖱️ Klick / Tipp auf eine Spalte | Wirft deinen Stein hinein |
| ⬅️ ➡️ / **A D** | Spaltencursor bewegen |
| **1** – **7** | Zu dieser Spalte springen |
| **Enter** / **Leertaste** / ⬇️ / **S** | In die Cursor-Spalte einwerfen (Enter/Leertaste starten · setzen fort · beginnen auch die nächste Runde) |
| **P** / **Esc** | Pause / Fortsetzen |
| **R** | Neue Runde (die Serie bleibt) |
| **N** | Modus wechseln (PvP → Leicht → Mittel → Schwer; startet eine neue Serie) |
| **C** | Serienergebnisse zurücksetzen (fragt vorher – **Enter** bestätigt, **Esc** behält) |
| **Shift + C** | Serienergebnisse ohne Nachfrage zurücksetzen |
| **T** | Dunkles / helles Design umschalten (eigenständige Seite) |

Auf dem Handy zeigt das Steuerungs-Panel statt der Tasten die Touch-Hilfe. Die Pfeiltasten rufen `preventDefault()` auf, damit die Seite nie scrollt. Jede Spalte ist ein `<button>`, beschriftet mit ihrem Inhalt
(`Spalte 4, 2 von 6: deins (rot), KI (gelb) (von unten)`); hat eine Spalte den Tastaturfokus, folgt der Fokus dem Cursor.
Enter / Leertaste auf einem fokussierten Button aktivieren nativ diesen Button.

### 📱 Auf dem Handy

Tippe **irgendwo in eine Spalte** – auf ein Loch oder in den Zwischenraum zwischen den Löchern –, und dein Stein fällt dort hinein; schon der erste Tipp zählt
(auf Touchscreens ist die Hover-Vorschau aus, damit iOS ihn nie verschluckt). Das Brett passt sich so an, dass es auch im 360-px-Hochformat
ohne horizontales Scrollen passt. Der Knopf **Regeln** erklärt das Spiel, **Beenden** beendet das Spiel vorzeitig (der Punktestand der aktuellen Runde – 0, bis sie
entschieden ist – kommt in die Bestenliste) und **Vollbild** blendet die Browserleisten aus. Auf dem iPhone nutze für eine Ansicht ohne Leisten
*Teilen → Zum Home-Bildschirm*.

## 🎯 Wertung & Statistik

Jede **Runde ist ein Arcade-Durchgang**. Endet eine Runde, wird sie mit dem gemeinsamen `duelRoundScore` des Kits gewertet (dieselbe Formel wie bei
Gomoku und Tic-Tac-Toe), aus Sicht des Menschen, mit `moves` = von beiden Spielern eingeworfene Steine und `boardCells` = 42:

| Ergebnis | Punkte | Leicht (Basis 100) | Mittel (Basis 250) | Schwer (Basis 500) |
| --- | --- | --- | --- | --- |
| Sieg | `Basis × (1 + leere Felder / 42)` | 183 (Sieg mit 7 Steinen) … 150 (21 Steine) … 100 | 458 … 375 … 250 | **917** … 750 … 500 |
| Unentschieden | `Basis / 4` | 25 | 63 | 125 |
| Niederlage | 0 | 0 | 0 | 0 |
| PvP | 0 – ungewertet | | | |

**Vorzeitig beenden** beendet das ganze Spiel (der Autosave wird gelöscht) und wertet den Punktestand der aktuellen Runde, der 0 ist, bis die Runde
entschieden ist; im lokalen Zwei-Spieler-Modus ist er ungewertet. Der Regeln-Dialog und das Modus-Panel zeigen den echten Bereich, vom Sieg mit 42 Steinen (die Basis)
bis zum Sieg mit 7 Steinen.

Die Statusleiste zeigt:

| Anzeige | Bedeutung |
| --- | --- |
| **Punkte** | Der Punktestand der aktuellen Runde (0 während des Spiels, wird am Rundenende gesetzt) |
| **Bestwert** | Bester Einzelrunden-Punktestand aller Zeiten (`arcade.stats.connect4`, mit dem Portal geteilt) |
| **W–L–D** | Deine Siege – KI-Siege – Unentschieden in dieser Serie (im PvP: **R–Y–D**, Rot – Gelb – Unentschieden) |
| **Zeit** | Aktive (nicht pausierte) Zeit der aktuellen Runde |

Das **Serien**-Panel wiederholt den Stand in großen Zahlen und zeigt die Seriepunkte (die Summe der Rundenpunkte in diesem Modus).
Jede beendete Runde wird vom Kit einmal unter `arcade.stats.connect4` erfasst (`best`, `plays`, `wins`, `totalScore`,
`totalSeconds`, `lastScore`, `lastPlayedAt`). PvP-Runden werden als ungewertet erfasst (`ranked: false`, Ergebnis aus Sicht von Rot):
sie zählen als Spiele, berühren aber nie den Bestwert oder die Bestenliste, und `onGameOver` wird für sie nicht aufgerufen.

## 💾 Automatisches Speichern & Fortsetzen

Die Sitzung ist die **ganze Serie**, nicht nur die Runde: Brett, Spaltenverlauf, Spieler am Zug, Modus, Eröffner, Serienergebnisse und
Punkte (Schlüssel `arcade.session.connect4`, mit Schema-Version). Ein strenger Validator **spielt die gespeicherte Spaltenliste nach**
und lehnt alles ab, was nicht exakt passt (schwebende Steine, ein Stein nach dem Sieg, falsche Zugreihenfolge, falsche Hervorhebung).
Gespeichert wird etwa einmal pro Sekunde, immer wenn die Seite verborgen wird und beim Unmount – und die Sitzung bleibt **zwischen den Runden** erhalten. Vorzeitiges Beenden löscht den Speicherstand.
Beim Neuladen erscheint **Willkommen zurück** mit pausierter Serie (*Weiter* · *Neue Runde* · *Neue Serie*); eine bereits beendete Runde
wird nicht wiederholt – die Serie geht mit einer frischen Runde weiter. Sonst löschen ihn nur **Verwerfen** neben dem Badge *Automatisch gespeichert* (zurück zu einem
leeren Brett), *Ergebnisse zurücksetzen* oder ein Moduswechsel.

## 🧩 Einbettung in Arcade-Game-Center

```tsx
import { ConnectFourGame, ConnectFourDemo } from '@arcade/connect4';

<ConnectFourGame
  embedded                                   // blendet den Seitentitel aus; das Portal zeigt ihn
  onGameOver={(score, info) => submitScore('connect4', score, info?.finished)}   // gewertete Runden mit Punkten > 0 und vorzeitiges Beenden (auch bei 0)
  onRunEnd={(run) => console.log(run.outcome, run.ranked)} // jede Runde, auch PvP
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<ConnectFourDemo active={cardIsVisible} />    // Demo-Modus für die Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`.

Statusabbildung: `idle` vor der ersten Runde eines Besuchs (Start-Overlay), `running` während eine Runde gespielt wird, `paused` bei
Unterbrechung (oder Wiederherstellung), `gameOver` vom Moment des Rundenendes bis zum Start der nächsten. `score` ist der Punktestand der
aktuellen Runde; `runKey` ist ein Rundenzähler.

## 🧠 So funktioniert es

Die Engine ist ein einziger reiner Reducer, `advanceGame(state, action)`, über ein Array mit 42 Zellen (Zeile 0 oben) und den Spaltenverlauf:

```
playing ──┬── (vier in einer Reihe) ────────→ won   ─┐
          └── (Brett voll, keine vier) ─────→ draw  ─┴─ newRound → playing (Verlierer beginnt)
```

1. **`drop`** setzt den Stein des Spielers am Zug auf die unterste freie Zelle einer Spalte – abgelehnt beim Zug der KI, bei vollen Spalten und nach dem Rundenende.
2. **`aiMove`** trägt die Spalte der KI **und den Halbzug, für den gesucht wurde**; eine veraltete Antwort für eine inzwischen geänderte Stellung wird ignoriert.
3. Zuerst die Gewinnprüfung (jede Linie durch den neuen Stein, sodass auch fünf in einer Reihe und sich kreuzende Linien leuchten), dann die Prüfung auf Unentschieden bei vollem Brett.
4. Eine beendete Runde wird mit `duelRoundScore` **gewertet**; Seriepunkte und Stand werden im selben Schritt aktualisiert.
5. **`newRound`** leert das Brett und behält die Serie; **`changeMode`** startet eine neue Serie; **`resetScores`** setzt sie auf null.

### 🤖 Spielmodi & KI

| Modus | Rot (eröffnet Runde 1) | Gelb | Engine |
| --- | --- | --- | --- |
| **PvP** | Mensch | Mensch (am selben Gerät) | — |
| **Leicht** | Mensch | KI | Tiefe 2, breite Zufallswahl, 30 % Zufallseinwürfe (kann ein Blocken verpassen) |
| **Mittel** | Mensch | KI | Tiefe 4, zufällig unter nahezu gleichwertigen Zügen |
| **Schwer** | Mensch | KI | iterative Vertiefung ≥ 10 Halbzüge, ~450 ms Budget, deterministisch |

Jede Stufe **nimmt einen sofortigen Gewinn mit**; Mittel und Schwer **blocken immer** eine unmittelbare Drohung (Leicht meistens).

Die Suche (`src/logic/ai.ts`, `src/logic/bitboard.ts`):

- **Bitboard** – das klassische 7 × (6 + 1)-Layout (Bit `col·7 + row`, eine leere Sentinel-Zeile pro Spalte, damit Linien nie umbrechen),
  an einer Spaltengrenze in zwei 32-Bit-Ganzzahlen geteilt (Spalten 0–3 / 4–6). Vier in einer Reihe, „Gewinnzellen“ und spielbare Zellen sind eine
  Handvoll Verschiebungen und UND-Verknüpfungen – ohne BigInt, ohne Allokation.
- **Negamax + α-β** mit Zugsortierung: zuerst der Zug aus der Transpositionstabelle, dann der Einwurf, der die meisten Drohungen schafft, bei Gleichstand von der Mitte aus.
- **Nicht verlierende Züge** (nach Pascal Pons): hat der Gegner nur eine spielbare Gewinnzelle, wird nur das Blocken gesucht, bei zwei ist die
  Stellung verloren, und ein Einwurf direkt unter einer gegnerischen Gewinnzelle wird nie gesucht.
- **Transpositionstabelle** – 2¹⁸ typisierte Array-Plätze, Schlüssel ist die eindeutige Kodierung `stones + mask`; gespeichert werden Wert, Schranke, Tiefe und bester Zug.
  Gewinnwerte sind absolut (`WIN − Steine auf dem Brett`), sodass Einträge über Iterationen gültig bleiben; die Tabelle wird pro Suche geleert,
  damit Ergebnisse nie von früheren Spielen abhängen.
- **Heuristik** an der Tiefengrenze: alle 69 Vierer-Linien werden beim Setzen / Zurücknehmen inkrementell bewertet (1 / 4 / 16 Punkte für einen / zwei /
  drei Steine in einer sonst leeren Linie, Vorzeichen je nach Seite) plus 3 Punkte pro Stein der mittleren Spalte – O(1) an den Blättern.
- **Iterative Vertiefung** (Schwer) mit Zeitbudget und Knotenlimit; eine unfertige Iteration wird verworfen. Sie läuft auf einem Laptop mit ~3 Mio. Knoten/s,
  erreicht im Budget Tiefe 15–22 und löst die letzten ~20 Halbzüge exakt.

`useAITurn` wartet die gewählte Verzögerung ab und führt die Suche dann im Timeout-Callback aus – abseits des Renderpfads und außerhalb des
(reinen) Reducers – und schickt die Spalte ab; jede Zustandsänderung, Pause, jeder Dialog oder Unmount bricht sie ab.

### 🎬 Demo

`ConnectFourDemo` lässt zwei schnelle KIs (Tiefe 3, zufällige Eröffnung, etwas Spielraum und 6 % Patzerquote) auf der echten Engine spielen:
alle 360 ms ein Stein, 1,6 s nach jedem Ergebnis eine neue Runde. Es rendert das Mini-Brett, hat keine Tastatur-Listener, keine Statistik und
keine Speicherzugriffe und friert ein, wenn `active` falsch ist.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Den Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Logik- und Komponententests) |
| `npm run check` | lint → typecheck → test → build (das führt die CI aus) |

## 🏗️ Architektur

```
src/
  arcade/                 eingebundenes Zoltan's-Arcade-Kit – hier nicht bearbeiten (siehe dessen README)
  logic/                  reine Spielregeln, ohne React
    types.ts constants.ts
    board.ts              Einwurf / Landezeile / Gewinnlinien / Nachspielen auf dem 42-Zellen-Array
    game.ts               advanceGame-Reducer, createInitialState, roundOutcome, Wertung
    bitboard.ts           Zwei-Ganzzahlen-Bitboard Position mit make / unmake und inkrementeller Heuristik
    ai.ts                 Negamax α-β + TT + iterative Vertiefung, chooseMove je Stufe
    autopilot.ts          KI-gegen-KI-Demotreiber + Seeded-RNG
    persist.ts            strenge Laufzeitprüfung gespeicherter Sitzungen (spielt die Züge nach)
  hooks/                  useAITurn, useConnectFourKeys, useAIDelay
  components/             GameBoard (voll + mini), ModeSelect, AISpeedToggle
  rules.tsx               Abschnitte der Regeln und das FourDiagram
  demo/ConnectFourDemo.tsx  Demo-Modus für die Startseite
  ConnectFourGame.tsx     das einbettbare Spiel (ArcadeGameProps)
  App.tsx                 eigenständige Seite: <ArcadeShell><ConnectFourGame/></ArcadeShell>
  main.tsx                Einstieg; lädt das gemeinsame arcade.css einmal
  index.ts                Paketeinstieg für Arcade-Game-Center
```

## 🤝 Mitwirken

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Mitwirkende stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md); Änderungen in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
