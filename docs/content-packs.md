# Content packs: languages, countries, literary passages

DayTale has no build step. Content that grows with each language or country lives in plain JS modules,
so adding one is a matter of adding a file and one line in a registry.

## Literary passages (the "문학 한 구절" line on the home story)

| File | What it holds |
| --- | --- |
| `app/js/story/lit/catalogue.js` | `AUTHORS` (name, country, original language, years) and `CATALOGUE`: one row per passage with its tags. No text. |
| `app/js/story/lit/<lang>.js` | The text for one language: `{ id: 'text with **bold quote**' }`. |
| `app/js/story/lit.js` | `PACKS` registry (one line per language), loading, server overlay, and `pickLit`. |

The app loads **only the user's language pack** (`loadLit(getLang())` in `main.js`, a dynamic `import()`).
A language with no registered pack falls back to the English pack (`FALLBACK = 'en'`).
Inside a registered pack, any id that is missing is simply skipped for that language — the story never
mixes languages.

### Catalogue row

```js
{ id: 42, a: 'basho', o: 'ja', s: 'autumn', t: 'night', w: 'rain', sun: 1, work: 'Oku no Hosomichi' }
```

- `id` — stable number. Never renumber or reuse: devices remember recent ids (14-day no-repeat). New rows take the next number after the last one.
- `a` — author key in `AUTHORS`. Used for the same-author cooldown (an author rests for the next 6 picks, about 3 days).
- `o` — original language of the passage (ISO 639-1, or `'world'`). This decides the mix for each reader:
  - `o === reader's language` → **own country** bucket (30%)
  - `o` in `REGIONAL` (`ko`, `ja`) for any other reader → **other regional** bucket (10%)
  - anything else (`zh`, `de`, `ru`, `world`, …) → **world classics** bucket (60%)
  When a German pack is added, passages with `o: 'de'` (Rilke, Goethe, Heine…) automatically become "own country" for German readers.
- `s` season (`spring|summer|autumn|winter`), `t` time of day (`morning|day|evening|night`, or an array), `w` weather (`clear|cloud|rain|snow`) — empty means any time. Matching tags make a line more likely (+2 season, +2 time, +3 weather).
- `sun: 1` — mentions sunlight / blue sky; never shown after sunset. `t: 'night'` lines can also appear on a dark evening.
- `work` — title of the work, when known (informational).

Rules for content: authors dead 70+ years, works published before 1930, translations our own. Wrap the quoted part in `**…**` (exactly one pair).

### Add a passage

1. Append a row to `CATALOGUE` with the next id (add the author to `AUTHORS` if new).
2. Add the text under the same id to every language pack you can; languages without it just skip it.
3. `node tools/e2e/story-audit.mjs` — checks ids, authors, `**` pairs, missing/unknown ids, and the sunlight wording.

### Add a language

1. Create `app/js/story/lit/<lang>.js` exporting `{ id: text }` (any subset of ids).
2. Add one line to `PACKS` in `app/js/story/lit.js`: `de: () => import('./lit/de.js'),`
3. Add the app language itself (`LANGS` in `core/config.js`, `i18n/<lang>.js`, `story/<lang>.js`) as usual.
4. Run `node tools/update-precache.mjs`. Language packs are **not** precached (only the catalogue is);
   the service worker caches the user's pack the first time it loads, so 50 languages do not bloat the install.

### Server additions (no app release)

The admin "이야기 문장" page writes rows to `phrase_packs`. Rows with `slot = 'lit'` are merged over the bundled
passages for that language (`setLitRemote`, called from `setRemote` when phrases load, cached for a day):

- `cond.id` = a bundled id → replaces that passage's text (and any tags given) for that language.
- no `cond.id` → a new passage with id `s<row id>`; `cond.a` author key, `cond.o` original language (default `world`).
- tags use the admin vocabulary: `tod`, `season`, `wx` (`sun`→clear, `rain`/`thunder`→rain, `snow`, others→cloud), `light: true` (= `sun: 1`).
- `weight` (1–10) adds to the pick weight. Text limit is 300 characters (bundled passages are ≤ 244).

The admin API (`supabase/functions/admin-api`) validates these keys only for `slot = 'lit'`. No schema change was needed
(`phrase_packs.slot` is free text).

## Who may be quoted (rule, 2026-10-16)

- Judge each person by what they are famous **for**. Writers, poets, philosophers and artists are in. People famous for a role (politics, war, independence movements, religious leadership) are out, in every language, Korean included.
- No religious content, public domain only (author dead 70+ years, and check US copyright too, e.g. The Little Prince is still protected there).
- Lines spoken by characters in novels (Anne of Green Gables, Little Women, The Secret Garden) are the safest source; prefer them.
- Before each weekly batch upload, re-read every line once per target country.

## Countries: `app/js/core/countries.js`

One row per country (ISO 3166-1 alpha-2):

```js
AU: C('en', 'C', 'south', 'sydney', 1)   // lang, temp unit, climate, default weather city, first weekday
```

| Field | Used by |
| --- | --- |
| `lang` | `i18n.detectLang` — if none of the device languages is supported, the country's language is tried before English. |
| `temp` | `'F'` shows °F in the story (`engine.js`, by device locale region). Hot/cold logic stays Celsius. |
| `climate` | `seasonFor()` in the story: `north`, `south` (seasons flipped), `tropical` (season = `null`: no season-tagged sentences or passages, so no winter/snow talk). Region comes from the chosen weather city, else the device locale. Countries not in the table use the city latitude (|lat| < 23.44 → tropical, < 0 → south), else north. |
| `city` | `cities.guessCity` fallback when the time zone does not name a city (must be an id in `data/cities.js`). |
| `week` | Default `weekStart` preference for new users (0 Sunday, 1 Monday); users can still change it. |

Holidays: there is no per-country holiday calendar yet. Holiday lines are added per language from the admin
(`phrase_packs` with a date range). Prices are not in this table.

### Add a country

Add one line to `COUNTRIES`. If it needs a weather city, add the city to `data/cities.js` first.
