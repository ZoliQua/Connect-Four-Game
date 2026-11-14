# 🔴 Connect Four – Négy a sorban

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

Típusbiztos Négy a sorban (Connect Four) **React 18**, **Vite** és **TypeScript** alapokon – 7 × 6-os keret, hulló korongok animációja,
kétszemélyes mód és három MI-szint, amelyeket egy **bitboardos negamax α-β vágással, átviteli táblával és iteratív mélyítéssel** hajt meg.
Önállóan fut, **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyike –
játszhatod itt: [dulzoltan.hu/arcade/#/play/connect4](https://dulzoltan.hu/arcade/#/play/connect4).

[![CI](https://github.com/ZoliQua/Connect-Four-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Connect-Four-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#️-a-zoltans-arcade-család)
- [Funkciók](#-funkciók)
- [Gyors indítás](#-gyors-indítás)
- [Vezérlés](#️-vezérlés)
- [Mobilon](#-mobilon)
- [Pontozás és statisztika](#-pontozás-és-statisztika)
- [Automatikus mentés és folytatás](#-automatikus-mentés-és-folytatás)
- [Beágyazás az Arcade-Game-Centerbe](#-beágyazás-az-arcade-game-centerbe)
- [Hogyan működik](#-hogyan-működik)
- [Szkriptek](#-szkriptek)
- [Felépítés](#️-felépítés)
- [Közreműködés](#-közreműködés)
- [Licenc](#️-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is becsatlakozik. Közös a dizájnrendszerük, a pontozási modelljük és a mentési formátumuk, a beágyazott [`src/arcade/`](./src/arcade) kiton keresztül.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztikák, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Árkád |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Logikai |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütő |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 **Connect Four** (ez a repó) | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logikai |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🂡 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 🔴 **Klasszikus 7 × 6-os Négy a sorban** – a korongok símán a legalsó üres lyukba esnek (CSS transzformáció; csökkentett mozgásnál kikapcsolva)
- 🎮 **Négy mód** – kétszemélyes, Könnyű, Közepes (alapértelmezett) és Nehéz; az MI elleni módok pontozottak
- 🧠 **Valódi kereső MI** – bitboardos negamax, α-β vágás, átviteli tábla, „nem vesztő lépések” szűrése, ablakos heurisztika;
  a Nehéz szint ~450 ms alatt iteratívan 10+ lépésig (jellemzően 15–22) mélyít, és a végjátékot pontosan megoldja
- 👆 **Lebegő / billentyűs előnézet** – egy szellemkorong mutatja, hová esik a dobásod; a nyerő négy (vagy öt…) világít, a többi elhalványul
- 🏆 **Egységes arcade-pontozás** – minden kört a közös párbajképlet pontoz; a Rekord, a játékszám és a győzelmek közösek a portállal
- 📊 **Sorozat-eredményjelző** – Te / Gép / Döntetlen (kétszemélyes módban Piros / Sárga / Döntetlen) és a sorozat pontjai
- 🔄 **A vesztes kezd** – az előző kör vesztese nyit a következőben (döntetlennél és félbehagyott körnél a kezdő váltakozik)
- 📖 **Szabályok ablak** – cél, játékmenet, szabályok, a valódi pontozási tartományok és egy ábra (a **Szabályok** gombbal; megnyitáskor a kör szünetel)
- 🏁 **Idő előtti befejezés** – megerősítés után az egész játékot lezárja, és az aktuális kör pontszámát rangsorolja (0, amíg a kör el nem dől; kétszemélyes módban nem rangsorolt)
- 📱 **Mobilbarát** – koppints az oszlop bármely pontjára, és a korong beesik; nincs dupla koppintás, és a táblán nem görög vagy nagyít az oldal; a **Teljes képernyő** gomb eltünteti a böngészősávokat
- ⏸️ **Szünet** (P / Esc, vagy automatikusan, ha a lap háttérbe kerül) – megállítja a táblát, az MI-t és a körönkénti időmérőt
- 💾 **Automatikus mentés és folytatás** – az egész sorozat (tábla, eredmények, pontok, mód) túléli az újratöltést és a lap bezárását
- ⚡ **MI-késleltetés** – azonnali / 0,15 s / 0,4 s / 1 s gondolkodási idő, megjegyezve
- 🌗 **Sötét / világos téma**, közös az összes arcade-játékkal (**T** billentyű)
- 🌍 **Három nyelv** – angol, magyar és német; a felső sávban vagy a beállításokban váltható (a hivatkozásokhoz `?lang=en|hu|de` is használható); a számok a nyelv szerinti tagolást követik
- 🦷 **Fogas mód** – a beállításokban „Fogas mód” / "Dental mode" / „Zahnmodus” kapcsoló, alapból kikapcsolva (vagy `?dental=1`), az egész arcade-ban közös: a korongok fogak, metszőfog és őrlőfog sziluettekkel (alakkal, nem csak színnel); csak megjelenés
- 🤖 **Demó üzemmód** (`<ConnectFourDemo />`) – két gyors, kicsit véletlenszerű MI játszik a valódi motoron a portál nyitóoldalán
- ⌨️ **Billentyűzet-központú és akadálymentes** – az oszlopok valódi gombok `aria-label`-lel, látható fókusz, gördülő fókusz;
  a gyorsbillentyűket figyelmen kívül hagyja, ha űrlapmezőbe gépelsz vagy Cmd/Ctrl/Alt van lenyomva
- 🧪 **Tesztelt** – szabályok, bitboard–tömb keresztellenőrzések, pontos végjáték-megoldás a sima minimaxszal szemben, MI-taktika, pontozás,
  a mentésellenőrző, a demó és a komponensek viselkedése

## 🚀 Gyors indítás

**Node ≥ 20** és npm szükséges.

```bash
git clone https://github.com/ZoliQua/Connect-Four-Game.git
cd Connect-Four-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív elérési utakat használ, így a `dist/` bármely almappából kiszolgálható.

## ⌨️ Vezérlés

| Billentyű | Művelet |
| --- | --- |
| 🖱️ Kattintás / koppintás egy oszlopra | Bedobod a korongod |
| ⬅️ ➡️ / **A D** | Az oszlopkurzor mozgatása |
| **1** – **7** | Ugrás az adott oszlopra |
| **Enter** / **Szóköz** / ⬇️ / **S** | Bedobás a kurzor oszlopába (Enter/Szóköz indít · folytat · következő kört is kezd) |
| **P** / **Esc** | Szünet / folytatás |
| **R** | Új kör (a sorozat megmarad) |
| **N** | Módváltás (kétszemélyes → Könnyű → Közepes → Nehéz; új sorozatot indít) |
| **C** | A sorozat eredményeinek nullázása (előbb rákérdez – az **Enter** megerősíti, az **Esc** megtartja) |
| **Shift + C** | A sorozat eredményeinek nullázása kérdés nélkül |
| **T** | Sötét / világos téma váltása (önálló oldalon) |

Mobilon a Vezérlés panel a billentyűk helyett az érintéses súgót mutatja. A nyílbillentyűk `preventDefault()`-ot hívnak, így az oldal sosem görög. Minden oszlop egy `<button>`, a tartalmával felcímkézve
(`4. oszlop, 2 / 6: a tiéd (piros), a gépé (sárga) (alulról felfelé)`); ha egy oszlopnak billentyűfókusza van, a fókusz követi a kurzort.
A fókuszált gombon az Enter / Szóköz natívan azt a gombot aktiválja.

### 📱 Mobilon

Koppints **az oszlop bármely pontjára** – lyukra vagy a lyukak közti résre –, és a korongod ott esik be; már az első koppintás számít
(érintőképernyőn a lebegő előnézet ki van kapcsolva, így az iOS soha nem nyeli el). A tábla úgy méreteződik, hogy 360 px-es álló kijelzőn is elférjen,
vízszintes görgetés nélkül. A **Szabályok** gomb elmagyarázza a játékot, a **Befejezés** idő előtt lezárja a játékot (az aktuális kör pontszáma –
0, amíg el nem dől – kerül a ranglistára), a **Teljes képernyő** pedig eltünteti a böngészősávokat. iPhone-on a sáv nélküli nézethez használd a
*Megosztás → Főképernyőhöz adás* lehetőséget.

## 🎯 Pontozás és statisztika

Minden **kör egy arcade-futam**. Amikor egy kör véget ér, a kit közös `duelRoundScore` függvénye pontozza (ugyanaz a képlet, mint a
Gomokunál és a Tic-Tac-Toénál) az ember oldaláról, ahol a `moves` a két játékos által bedobott korongok száma, a `boardCells` pedig 42:

| Eredmény | Pont | Könnyű (alap 100) | Közepes (alap 250) | Nehéz (alap 500) |
| --- | --- | --- | --- | --- |
| Győzelem | `alap × (1 + üres mezők / 42)` | 183 (7 korongos győzelem) … 150 (21 korong) … 100 | 458 … 375 … 250 | **917** … 750 … 500 |
| Döntetlen | `alap / 4` | 25 | 63 | 125 |
| Vereség | 0 | 0 | 0 | 0 |
| Kétszemélyes | 0 – nem rangsorolt | | | |

Az **idő előtti befejezés** az egész játékot lezárja (az automatikus mentés törlődik), és az aktuális kör pontszámát rangsorolja, ami 0,
amíg a kör el nem dől; kétszemélyes módban nem rangsorolt. A Szabályok ablak és a Mód panel a valódi tartományt írja ki, a 42 korongos
győzelemtől (az alap) a 7 korongosig.

Az állapotsáv ezt mutatja:

| Mutató | Jelentés |
| --- | --- |
| **Pont** | Az aktuális kör pontszáma (0 játék közben, a kör végén áll be) |
| **Rekord** | A legjobb egyetlen körös pontszám (`arcade.stats.connect4`, közös a portállal) |
| **W–L–D** | A te győzelmeid – a gép győzelmei – döntetlenek ebben a sorozatban (kétszemélyesben: **R–Y–D**, piros – sárga – döntetlen) |
| **Idő** | Az aktuális kör aktív (szünet nélküli) ideje |

A **Sorozat** panel nagy számokkal ismétli az állást, és mutatja a sorozat pontjait (a körpontok összege ebben a módban).
Minden befejezett kört a kit egyszer rögzít az `arcade.stats.connect4` alatt (`best`, `plays`, `wins`, `totalScore`,
`totalSeconds`, `lastScore`, `lastPlayedAt`). A kétszemélyes köröket nem rangsorolt futamként rögzíti (`ranked: false`, az eredmény a piros oldaláról):
számítanak játékszámnak, de sosem érintik a Rekordot vagy a ranglistát, és az `onGameOver` sem hívódik meg értük.

## 💾 Automatikus mentés és folytatás

A munkamenet az **egész sorozat**, nem csak a kör: tábla, oszloptörténet, soron következő oldal, mód, kezdő, a sorozat eredményei és
pontjai (kulcs: `arcade.session.connect4`, sémaverzióval). Szigorú ellenőrző vizsgálja, amely **újrajátssza a mentett oszloplistát**,
és minden eltérést elutasít (lebegő korong, nyerés utáni korong, hibás lépéssorrend, hibás kiemelés).
Nagyjából másodpercenként menti, valahányszor a lap háttérbe kerül, és kilépéskor – és **a körök között is megmarad**. Az idő előtti befejezés törli a mentést.
Az újratöltés az **Üdv újra!** képernyőt mutatja szüneteltetett sorozattal (*Folytatás* · *Új kör* · *Új sorozat*); az már befejezett kört
nem játssza újra – a sorozat új körrel folytatódik. Egyébként csak az **Elvetés** az *Elmentve* jelvény mellett (vissza egy üres táblához),
az *Eredmények nullázása* gomb vagy egy módváltás törli.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { ConnectFourGame, ConnectFourDemo } from '@arcade/connect4';

<ConnectFourGame
  embedded                                   // elrejti az oldalcímet; a portál mutatja
  onGameOver={(score, info) => submitScore('connect4', score, info?.finished)}   // rangsorolt körök > 0 ponttal, és az idő előtti befejezés (0-nál is)
  onRunEnd={(run) => console.log(run.outcome, run.ranked)} // minden kör, a kétszemélyes is
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<ConnectFourDemo active={cardIsVisible} />    // nyitóoldali demó üzemmód
```

Mindkét komponens a `src/arcade/types.ts` közös `ArcadeGameProps` / `ArcadeDemoProps` szerződését követi.

Állapotleképezés: `idle` a látogatás első köre előtt (Start képernyő), `running` amíg egy kör folyik, `paused` felfüggesztve
(vagy visszaállítva), `gameOver` attól a pillanattól, hogy egy kör véget ér, a következő indulásáig. A `score` az aktuális kör
pontszáma; a `runKey` körszámláló.

## 🧠 Hogyan működik

A motor egyetlen tiszta redukáló, `advanceGame(state, action)`, egy 42 cellás tömbön (a 0. sor felül van) és az oszloptörténeten:

```
playing ──┬── (négy egy sorban) ──────────→ won   ─┐
          └── (megtelt a tábla, nincs négy) → draw  ─┴─ newRound → playing (a vesztes kezd)
```

1. A **`drop`** a soron következő oldal korongját az oszlop legalsó üres cellájába teszi – elutasított az MI lépésénél, teli oszlopnál és a kör vége után.
2. Az **`aiMove`** az MI oszlopát **és a kereséskori lépésszámot** hordozza; a megváltozott állásra érkező elavult választ figyelmen kívül hagyja.
3. Először a nyerés ellenőrzése (az új koronggal átmenő minden vonal, így az öt egy sorban és a keresztező vonalak is kivilágosodnak), aztán a teli tábla miatti döntetlen.
4. A befejezett kört a `duelRoundScore` **pontozza**; a sorozat pontjai és az állás ugyanabban a lépésben frissül.
5. A **`newRound`** üríti a keretet és megtartja a sorozatot; a **`changeMode`** új sorozatot indít; a **`resetScores`** nullázza.

### 🤖 Játékmódok és MI

| Mód | Piros (az 1. kört nyitja) | Sárga | Motor |
| --- | --- | --- | --- |
| **Kétszemélyes** | Ember | Ember (ugyanazon az eszközön) | — |
| **Könnyű** | Ember | MI | 2 mélység, széles véletlen választás, 30 % véletlen dobás (a blokkolást elhibázhatja) |
| **Közepes** | Ember | MI | 4 mélység, véletlen a közel azonos értékű lépések közül |
| **Nehéz** | Ember | MI | iteratív mélyítés ≥ 10 lépésig, ~450 ms keret, determinisztikus |

Minden szint **megteszi az azonnali nyerő lépést**; a Közepes és a Nehéz **mindig blokkolja** az azonnali fenyegetést (a Könnyű általában).

A keresés (`src/logic/ai.ts`, `src/logic/bitboard.ts`):

- **Bitboard** – a klasszikus 7 × (6 + 1) elrendezés (bit `col·7 + row`, oszloponként egy üres őrsor, hogy a vonalak ne csavarodjanak át),
  oszlophatáron két 32 bites egészre bontva (0–3. / 4–6. oszlop). A négy egy sorban, a „nyerő cellák” és a játszható cellák
  néhány eltolás és ÉS művelet – BigInt és memóriafoglalás nélkül.
- **Negamax + α-β**, lépésrendezéssel: előbb az átviteli táblából származó lépés, aztán a legtöbb fenyegetést létrehozó dobás, döntetlennél középről kifelé.
- **Nem vesztő lépések** (Pascal Pons nyomán): ha az ellenfélnek egyetlen játszható nyerő cellája van, csak a blokkolást keresi; kettőnél az állás elveszett,
  és az ellenfél nyerő cellája alatti dobást sosem keresi.
- **Átviteli tábla** – 2¹⁸ típusos tömbhely, az egyedi `stones + mask` kódolás a kulcs, tárolja a pontot, a korlátot, a mélységet és a legjobb lépést.
  A nyerőpontok abszolútak (`WIN − a táblán lévő korongok`), így a bejegyzések az iterációk között érvényesek maradnak; a tábla keresésenként törlődik,
  így az eredmény sosem függ korábbi játékoktól.
- **Heurisztika** a mélységhatáron: mind a 69 négyes vonal pontozása lépésenként, inkrementálisan (egy / két / három korong egy egyébként üres vonalban
  1 / 4 / 16 pont, oldaltól függő előjellel), plusz 3 pont minden középső oszlopbeli korongért – a leveleknél O(1).
- **Iteratív mélyítés** (Nehéz) időkerettel és csomópontkorláttal; a befejezetlen iterációt eldobja. Egy laptopon ~3 M csomópont/s, a kereten belül 15–22 mélységet ér el,
  és az utolsó ~20 lépést pontosan megoldja.

A `useAITurn` megvárja a választott késleltetést, majd a keresést az időzítő visszahívásában futtatja – a renderelési úton kívül és a (tiszta)
redukálón kívül –, és beküldi az oszlopot; bármilyen állapotváltozás, szünet, párbeszédablak vagy kilépés megszakítja.

### 🎬 Demó

A `ConnectFourDemo` két gyors MI-t (3 mélység, véletlen nyitás, kis rugalmasság és 6 % hibázási arány) játszat a valódi motoron:
360 ms-onként egy korong, minden eredmény után 1,6 s-mal új kör. A mini táblát rendereli, nincs billentyűfigyelője, statisztikája és
tárolási írása, és az `active` hamis értékénél megáll.

## 🧪 Szkriptek

| Szkript | Cél |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logikai és komponensek tesztjei) |
| `npm run check` | lint → typecheck → test → build (ezt futtatja a CI) |

## 🏗️ Felépítés

```
src/
  arcade/                 beágyazott Zoltan's Arcade kit – itt ne szerkeszd (lásd a README-jét)
  logic/                  tiszta játékszabályok, React nélkül
    types.ts constants.ts
    board.ts              dobás / leérkezési sor / nyerővonalak / újrajátszás a 42 cellás tömbön
    game.ts               advanceGame redukáló, createInitialState, roundOutcome, pontozás
    bitboard.ts           kétegészes bitboard Position lépéssel / visszavonással és inkrementális heurisztikával
    ai.ts                 negamax α-β + átviteli tábla + iteratív mélyítés, chooseMove szintenként
    autopilot.ts          MI–MI demóvezérlő + magolt véletlenszám-generátor
    persist.ts            a mentett munkamenetek szigorú futásidejű ellenőrzése (újrajátssza a lépéseket)
  hooks/                  useAITurn, useConnectFourKeys, useAIDelay
  components/             GameBoard (teljes + mini), ModeSelect, AISpeedToggle
  rules.tsx               a szabályok szakaszai és a FourDiagram
  demo/ConnectFourDemo.tsx  nyitóoldali demó üzemmód
  ConnectFourGame.tsx     a beágyazható játék (ArcadeGameProps)
  App.tsx                 önálló oldal: <ArcadeShell><ConnectFourGame/></ArcadeShell>
  main.tsx                belépési pont; egyszer tölti be a közös arcade.css-t
  index.ts                az Arcade-Game-Center által használt csomagbelépő
```

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md), a [Magatartási kódex](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md) fájlt.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md) fájlban szerepelnek; a változások a [CHANGELOG.md](./CHANGELOG.md) fájlban.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Készítette ❤️-tel Zoltán Dul · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
