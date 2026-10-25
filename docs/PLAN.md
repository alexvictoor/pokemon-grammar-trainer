# Pokémon English — plan

A Pokémon-themed game for French lycée students practising English grammar. Routes are where students catch Pokémon by answering questions. Gyms are where they battle to prove they master a group of chapters. It ships as one standalone HTML file with no backend.

The syllabus is chapters 15 to 33 of the grammar workbook in `workbook/precis-grammatical.txt` (OCR text, gitignored, copyrighted). The workbook is the syllabus only. No question or explanation copies its wording.

## Decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Game loop | Routes to catch (practice), gyms to battle (test). Badges unlock the next chapters. |
| 2 | Teacher follow-up | Fully local. Students share a progress code with the teacher. |
| 3 | Level | Lycée, chapters 15 to 33: tenses, modals, questions, passive, relatives. |
| 4 | Questions | Original questions written from the rules. Templates fed by Pokémon data for the drill chapters. |
| 5 | Answers | Multiple choice on routes. Typed answers and word reordering in gyms. |
| 6 | Navigation | A region map with nodes, and menu screens. No tile map, no game engine. |
| 7 | Stack | Vue 3, Vite, TypeScript, Pinia, Vitest. The domain core imports no framework. |
| 8 | Pokémon data | A build-time snapshot from PokéAPI. Fully offline. |
| 9 | Pokémon | All species (about 1,025), as 96px pixel sprites. The build reports the missing sprites and uses a fallback image. |
| 10 | Structure | 19 routes (one chapter each) and 8 gyms (each tests a group of chapters). |
| 11 | Encounters | A correct answer throws a ball. Streaks give better balls (3: Great Ball, 5: Ultra Ball). A wrong answer resets the streak and can make a rare Pokémon flee. Nothing caught is ever lost. |
| 12 | Mastery | Leitner boxes per question. Mastery is computed per grammar rule. A gym unlocks at 70% mastery on its routes. |
| 13 | Battles | Team of 3. Each turn: choose a move, then answer. A stronger move asks a harder question. Real type matchups, simplified damage formula. Losing costs nothing. |
| 14 | Language | The interface is in English. The explanations after a wrong answer are in French. The Pokédex also shows the French name. |
| 15 | Progress code | The code carries the save itself: nickname, Leitner box per question, Pokémon seen and caught, date. The teacher page computes mastery per rule from it with the questions it ships with. Format `GT<version>-<checksum>-<deflated JSON, base64url>`. The checksum catches typos and truncation. No protection against forging. |
| 16 | Teacher page | `#teacher` in the same file. Paste whole messages: the page finds the codes, even wrapped over several lines. Class table (students × rules) with a class average, kept in the teacher's browser, CSV export (download or copy, `;` separators for French Excel). |
| 23 | Code delivery | Students send codes as text in a message (Pronote, ENT, email). No QR code for now. |
| 24 | Repeats | A missed question waits until three other questions were asked, across encounters too. |
| 17 | Delivery | One standalone HTML file, hosted at an unlisted URL and downloadable. When the game cannot save, it asks for the progress code, which doubles as a save. |
| 18 | Nintendo IP | Used freely with a low profile: disclaimer, no ads, no Pokémon name or logo in the title, unlisted URL. |
| 19 | Location | `~/code/pokemon-anglais`, its own git repo. Personal GitHub later, never the DiliTrust organisation. |
| 20 | Order | Slices 0 to 4 below. |
| 21 | Content format | JSON, checked by a schema at build time. |
| 22 | Judge | A Claude Code subagent judges each question. Verdicts are keyed by a hash of the question. The build refuses a question without a "pass" verdict for its current hash. |

## Architecture

- **`src/domain/`**: plain TypeScript, no Vue import. Answer checking, question selection, Leitner boxes, mastery per rule, catch odds, damage formula, progress-code codec, save/load. Most of the TDD happens here.
- **`src/ui/`**: Vue components and Pinia stores. They call the domain and hold no game rule.
- **`content/`**: one JSON file per chapter, `rules.json` (the rule tags), `verdicts.json` (the judge's verdicts).
- **`scripts/`**: the PokéAPI snapshot, the sprite sheet builder, the content check.
- **Build**: Vite with `vite-plugin-singlefile`. JS, CSS, data and sprites are inlined in one HTML file. Routing uses the URL hash, so `file://` works.

### Tests

- Unit tests (Vitest) for every domain module. Table-driven where the rule is a table: answer normalisation, type matchups, Leitner moves.
- Component tests for the screens.
- A few Playwright tests on the built HTML file: a catch, saving and reloading, a progress code read on the teacher page.
- Every test follows Arrange / Act / Assert, and its name starts with a third-person verb.

### Question shape (draft)

```json
{
  "id": "ch21-since-for-003",
  "chapter": 21,
  "rule": "present-perfect.since-vs-for",
  "difficulty": 2,
  "kind": "choice",
  "prompt": "Ash has been a trainer ___ ten years.",
  "answers": ["for"],
  "distractors": ["since", "during"],
  "explanation": "« for » + une durée (ten years). « since » + un point de départ (2015, Monday)."
}
```

`kind` is `choice`, `typed` or `reorder`. A typed question lists every accepted answer. Answer checking normalises case, spaces, apostrophes and contractions.

### Progress code (draft)

`{ v, nickname, badges, mastery: { [ruleId]: 0..100 }, date }`, serialised, deflated, base64url-encoded, with a short checksum. The version field lets the teacher page read older codes.

## Content judge

- `.claude/agents/question-judge.md` receives a batch of questions and the matching workbook rule.
- It returns one verdict per question with four pass/fail criteria, each with a short reason:
  1. One right answer: the expected answer is correct and no distractor is also correct.
  2. It tests its rule tag, not another rule.
  3. The French explanation is correct, well written and matches the workbook rule.
  4. The English is natural and suits a 16-year-old.
- Verdicts go to `content/verdicts.json`, keyed by the hash of the question. A manual override is stored there too, with its reason.
- Calibration before it gates: the teacher reviews the 30 questions of slice 1, the judge reviews them separately, and the prompt is tuned until it agrees with the teacher on the rejected questions.

## Slices

0. **Probe.** A single HTML file with an inlined manifest, a ~6 MB inlined payload, localStorage and IndexedDB, and service-worker attempts. Run it on Chrome Android, Safari iOS and a desktop browser, from a URL and from `file://`. It settles the hypotheses below.
1. **Walking skeleton.** One route for chapter 21 (present perfect), about 30 written questions. Encounter loop with multiple choice, catching, streaks, fleeing, French explanations, Leitner boxes, local save. A Pokédex of the catches. A snapshot of about 50 Pokémon. Delivered as the single HTML file. The judge is calibrated on these 30 questions.
2. **Progress code and teacher page.** The codec, the "share my progress" screen with a QR code, the class table and the CSV export. Loading a code restores a lost save.
3. **First gym.** Team choice, move choice, typed and reordering answers, damage formula, badge, route unlocking.
4. **Content at scale.** All Pokémon, the 19 routes, the 8 gyms, the templates for the drill chapters, evolutions.

## Slice 1 status

Built on 2026-10-25, not committed.

- Done: the domain core (answer check, Leitner boxes, mastery per rule and chapter, question picking, encounters, save and load), the content schema check, the verdict gate (off), the PokéAPI snapshot (58 Pokémon), the route, encounter and Pokédex screens, and the single-file build (`dist/index.html`, 335 KB). 100 tests.
- Judge calibration, 2026-10-25: the teacher passed all 30 questions. The judge failed 4. Three result questions only tested agreement or the participle, because their distractors avoided the simple past that American English accepts. One sentence said Ash had known Pikachu "for many years". The four were rewritten (present-tense distractors, an explicit present result, "for a long time"), the judge passed them, and the teacher approved them. The gate is on: the build refuses a question that is new or edited since it was judged.
- The judge runs as a subagent briefed with `.claude/agents/question-judge.md`. `pnpm content:record-verdicts <judge-output.json>` writes its verdicts with each question's hash.
- Rarity comes from PokéAPI's capture rate: 120 and above is common, 46 to 119 uncommon, 45 and below rare. The starter set holds many starters and dragons (rate 45), so 29 of 58 are rare.

## Slice 2 status

Built on 2026-10-25, not committed.

- Done: the progress codec (`src/domain/progressCode.ts`), the roster, class table and CSV (`src/domain/classroom.ts`), the Share tab (nickname, code, copy, restore with an in-page confirmation), and the `#teacher` page. 140 tests. Checked in Chromium at phone width, light and dark: a code created on the Share tab and pasted inside a message is read by the teacher page.
- A save from slice 1 still loads: the nickname is optional in the save format.
- Hypothesis, unverified: `CompressionStream('deflate-raw')` needs Chrome 103+ or Safari 16.4+. An older phone cannot create or read codes.

## Slice 3 status

Built on 2026-10-25, not committed.

- Done: the Cerulean City Gym (Misty: Staryu, Psyduck, Gyarados). It tests chapter 21 only until route 22 exists. It unlocks at 70% mastery of the route's multiple-choice questions. Each Pokémon has a safe move (Tackle, power 40, multiple choice) and a strong move of its first type (power 90, a typed or word-order question). Damage = ⌊power × max(Atk, SpA) ÷ mean(Def, SpD) × type multiplier × 0.4⌋ + 3, battle HP = 2 × base HP + 60, with the real type chart from PokéAPI. A correct answer lands the move. A wrong answer lets the leader hit with its strong move. Losing costs nothing. The badge is saved, carried in the progress code, and counted on the teacher page.
- Content: 20 gym questions in `content/chapter-21-gym.json` (12 typed, 8 word-order), all passed by the judge. The first review failed 11. The fixes: a quantity to rule out the present perfect continuous, prompts that no longer give the auxiliary, word-order sentences that American English cannot rebuild with a tile left out, and canon fixes. Answer checking now also reads `'s` as has or is.
- Mastery: the route screen and the gym unlock count the route's multiple-choice questions. The teacher page counts every question, gym ones included.
- 202 tests. Played to the badge in Chromium at phone width, light and dark.
- Open: the player's Pokémon shows its front sprite, where the games show its back (PokéAPI has back sprites; adding them doubles the sprite payload).

## Slice 4 status

Built on 2026-10-25, not committed.

- Region: the Kanto map, eight gyms in canon order. Gym 1's routes are open at the start; each badge opens the next gym's routes. Each gym's routes are its chapters (Route 15 = chapter 15). The gym unlocks at 70% mastery of its routes' multiple-choice questions. The first win also gives a legendary Pokémon of the gym's theme.

  | Gym | Leader, team | Chapters | Route types | Reward |
  |---|---|---|---|---|
  | Boulder | Brock: Geodude, Rhyhorn, Onix | 15, 16 | rock, ground, normal | Regirock |
  | Cascade | Misty: Staryu, Psyduck, Starmie | 17, 18 | water, ice | Suicune |
  | Thunder | Lt. Surge: Voltorb, Pikachu, Raichu | 19, 20 | electric, steel | Zapdos |
  | Rainbow | Erika: Victreebel, Tangela, Vileplume | 21, 22 | grass, bug | Celebi |
  | Soul | Koga: Koffing, Muk, Weezing | 23, 24 | poison, dark | Darkrai |
  | Marsh | Sabrina: Kadabra, Mr. Mime, Alakazam | 25, 31 | psychic, fairy, ghost | Mewtwo |
  | Volcano | Blaine: Growlithe, Ponyta, Arcanine | 26 to 30 | fire, fighting | Moltres |
  | Earth | Giovanni: Rhyhorn, Dugtrio, Nidoking | 32, 33 | dragon, flying | Rayquaza |

  This grouping was the draft below. It was built without the teacher's review.
- Pokémon: all 1,025 species (1.9 MB of data), with base stats, types, a legendary flag and a 96px sprite each. Each route draws the non-legendary Pokémon of its gym's types, split between the gym's routes (29 to 135 per route); every non-legendary species can be met. The 94 legendary and mythical species stay out of the wild; 8 are gym rewards, the other 86 cannot be obtained yet.
- Content: 770 questions over chapters 15 to 33 (30 route questions and 10 gym questions per chapter, plus the 20 extra gym questions of chapter 21), rules in `content/rules-NN.json`. Written by subagents briefed with `docs/CONTENT_GUIDE.md`, each chapter judged by a separate judge, failures fixed by their author and judged again until every question passed. The gate holds every verdict.
- Lessons the judge taught, now in the content guide: offer the competing tense, not only forms the time marker rules out; do not test a textbook distinction natives ignore (will vs going to for decisions, must vs have to); typed brackets must leave the rule's choice to the student; registers (take breakfast) and canon (Ash is ten, Pokémon Centers never close, Misty's Psyduck cannot swim) matter; explanations never state a rule more broadly than it is true.
- Answer checking also expands `'ll`, `shan't`, and reads `can not` as `cannot`.
- The chapter 17 "timetable" use (the boat leaves at 9) is not taught: every candidate question had several right answers. The rule became frequency adverbs.
- Teacher page: "All chapters" shows one column per chapter; choosing a chapter shows its rules. The CSV keeps every rule.
- Open: a teacher option to open every route (a class working on the passive cannot reach it before 7 badges); the 86 unobtainable legendaries; the back sprites.

## Build notes

- TypeScript stays on 5.9: vue-tsc 3.3 cannot drive TypeScript 7.
- pnpm 11 needs `allowBuilds: esbuild` in `pnpm-workspace.yaml`.
- Behind the corporate proxy, `pnpm snapshot:pokemon` needs `NODE_EXTRA_CA_CERTS` set to the system keychain's CAs.

## Probe results

Runs on 2026-10-25: headless Chromium on macOS (`http://127.0.0.1` and `file://`), and an Android 13 phone (OnePlus 8T) in the Claude app's WebView, Chrome 155, inside an artifact frame.

| Hypothesis | Status | Evidence |
|---|---|---|
| A service worker cannot be registered from a single file. | Confirmed | Chromium desktop and Android both reject `blob:` and `data:` script URLs ("URL protocol … is not supported"). Under `file://` any registration is rejected (origin `null`). |
| A 6 to 8 MB HTML file loads in acceptable time on a mid-range phone. | Confirmed on Android | 6.0 MB file: script runs 1.37 s after navigation start, over the network. Decoding 4.5 MB of base64 takes 8 ms. |
| localStorage and IndexedDB keep data across reloads. | Confirmed on Chromium desktop (`http`, `file://`) and the Android WebView | The visit counters went up on every reload. `storage.persist()` is refused everywhere, so the browser may still evict the data. The progress code stays the backup save. |
| A page with an inlined manifest and no service worker may not be installable. | Open | `beforeinstallprompt` never fired, but neither run could show it: headless Chromium and a WebView inside a frame. Needs Chrome Android at our own HTTPS URL. |
| Storage under `file://` is unreliable on phones. | Open | Not tested on a phone yet. |
| Safari iOS behaves the same. | Open | No iOS run yet. |

## Draft for review

### Chapters (numbers inferred from the OCR, to check against the book)

15 be · 16 have · 17 simple present · 18 present continuous · 19 simple past · 20 past continuous · 21 present perfect · 22 simple past or present perfect · 23 present perfect continuous · 24 past perfect · 25 the future · 26 modal auxiliaries · 27 ability · 28 obligation · 29 advice and suggestion · 30 probability with modals · 31 questions · 32 the passive · 33 relative clauses

### Gyms

| Gym | Routes (chapters) | Theme |
|---|---|---|
| 1 | 15, 16 | be and have |
| 2 | 17, 18 | present simple or continuous |
| 3 | 19, 20 | the past |
| 4 | 21, 22 | present perfect, and the choice with the simple past |
| 5 | 23, 24 | perfect continuous and past perfect |
| 6 | 25, 31 | the future and questions |
| 7 | 26 to 30 | modals |
| 8 | 32, 33 | passive and relatives |

Built as drafted in slice 4, without the teacher's review. See "Slice 4 status".

## Out of scope

Accounts, a backend, a tile map, runtime LLM calls, publishing on an app store.
