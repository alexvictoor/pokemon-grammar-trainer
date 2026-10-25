# Grammar Trainer

A Pokémon-themed game for French lycée students practising English grammar. Walk the routes of Kanto to catch Pokémon by answering questions, then beat the eight Gym Leaders with typed and word-order answers. Each route is a chapter of the grammar syllabus, from the verb *be* to relative clauses.

**Play:** https://alexvictoor.github.io/pokemon-grammar-trainer/ — installable as an app, and playable offline once loaded.

- **Students** share their progress as a text code (Share tab). The code is also a backup of their game.
- **Teachers** open the page with `#teacher` at the end of the address, paste the messages their students sent, and get a class table per chapter and per rule, with a CSV export.

The whole game is one self-contained `index.html`: it also works as a downloaded file, without the app install.

## Development

```bash
pnpm install
pnpm dev            # local server
pnpm test           # unit and component tests
pnpm build          # content gate, type-check, single-file build into dist/
```

- `docs/PLAN.md`: decisions, architecture and the status of each slice.
- `docs/CONTENT_GUIDE.md`: how to write questions. Every question is reviewed by the judge (`.claude/agents/question-judge.md`); `content/verdicts.json` holds the verdicts, and the build refuses a question that is new or edited since it was judged.
- `pnpm snapshot:pokemon` refreshes the Pokémon data from [PokéAPI](https://pokeapi.co/). `pnpm icons` redraws the app icons.

Unofficial fan project for English class. Pokémon © Nintendo / Game Freak / The Pokémon Company.
