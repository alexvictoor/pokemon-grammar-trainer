# Content guide

How to write the questions of one chapter. The judge (`.claude/agents/question-judge.md`) checks every question against the same rules. A question the judge fails does not ship.

## Audience and tone

- French lycée students, 15 to 17 years old, learning English. The game is Pokémon-themed.
- Sentences are natural English that a native speaker could say, with a Pokémon flavour: trainers, Gym Leaders, Pokémon, the Pokémon Center, routes, badges.
- Stay true to the canon. Do not give a Pokémon to the wrong character, do not invent traits that contradict a Pokémon's design, and remember Ash is always ten. When in doubt, use a generic character: my sister, my cousin, a trainer, Professor Oak.
- French Pokémon names are the official ones (Pikachu, Salamèche, Évoli, Ronflex, Psykokwak, Dracolosse…), and they are masculine in French: « le Chenipan », « un Évoli ».
- Never copy a sentence or an exercise from the workbook. The workbook is the syllabus only.

## Files for chapter NN

| File | Content |
|---|---|
| `content/rules-NN.json` | 3 to 7 rules taught by the chapter. `{ "id": "<topic>.<rule>", "chapter": NN, "label": "<short English label>" }`. Ids are kebab-case, e.g. `simple-past.irregular-verbs`. |
| `content/chapter-NN.json` | 30 route questions, all `choice`. |
| `content/chapter-NN-gym.json` | 10 gym questions: 6 `typed` and 4 `reorder`. |

Spread the questions evenly over the chapter's rules. Mix difficulties: about a third each of 1, 2 and 3.

Ids: `chNN-<rule-short>-001` for route questions, `chNN-gym-<rule-short>-001` for typed and `chNN-gym-order-<rule-short>-001` for word order. Lower case, digits and dashes only.

## The three kinds

```json
{ "id": "ch21-since-for-002", "chapter": 21, "rule": "present-perfect.since-for", "difficulty": 1, "kind": "choice",
  "prompt": "Brock has been a Gym Leader ___ 2019.", "answers": ["since"], "distractors": ["for", "during"],
  "explanation": "Since + un point de départ (une date, un moment : 2019, Monday, last summer). For + une durée (five years, two hours)." }

{ "id": "ch21-gym-irregular-001", "chapter": 21, "rule": "present-perfect.irregular-participle", "difficulty": 2, "kind": "typed",
  "prompt": "Snorlax has ___ (eat) twelve berries today!", "answers": ["eaten"],
  "explanation": "Après has, il faut le participe passé. Eat est irrégulier : eat – ate – eaten. Avec une quantité (twelve berries), on emploie la forme simple, pas has been eating." }

{ "id": "ch21-gym-order-just-001", "chapter": 21, "rule": "present-perfect.just", "difficulty": 2, "kind": "reorder",
  "prompt": "Je viens de voir un Mewtwo !", "tiles": ["I", "have", "just", "seen", "a", "Mewtwo!"], "decoys": ["come", "am"],
  "answers": ["I have just seen a Mewtwo!"],
  "explanation": "« Venir de » + infinitif se traduit par have / has just + participe passé : I have just seen. See – saw – seen." }
```

- `choice`: the prompt has one `___` blank. `answers` holds the right option (shown as written, so case matters). `distractors` holds 2 or 3 wrong options.
- `typed`: the prompt has one `___` blank, followed by the verb or words to use in brackets. The student types the missing words.
- `reorder`: the prompt is a French sentence to translate. `tiles` is the English sentence split into words, in order, punctuation attached to the last word. `tiles.join(' ')` must equal `answers[0]`. `decoys` are 1 to 3 extra words that tempt the typical error.

How answers are compared, for `typed` and `reorder`: lower case, spaces collapsed, a final `.`, `!` or `?` removed, and `n't`, `'ve`, `'m`, `'re`, `'ll`, `won't`, `can't`, `shan't` expanded. `'d` is not expanded: list it explicitly when it is an accepted form. `can not` is read as `cannot`. A response with `'s` is accepted when reading it as `has` or `is` matches. `choice` is compared exactly.

## One right answer

This is where most questions fail. A careful teacher must accept exactly the listed answers.

- **Check British and American English.** American English accepts the simple past where British English uses the present perfect ("I lost my key", "I just saw him", "Did you eat yet?"). Never offer such a form as a distractor, and never let a typed or reorder question accept only one of the two when both are correct.
- **Force the form with the context**, not with the options. A time marker (since, for … now, ago, yesterday, at the moment, every day, tomorrow), a stated present result, a quantity (which rules out a continuous form), a state verb (which rules out -ing), or "It's the first time".
- **Check the other aspect.** For each tense, ask whether the continuous or the simple form would also be correct, and whether a modal or a future form would be.
- **Distractors** are the errors French learners really make (calques of the French present, wrong auxiliary, wrong participle, wrong word order). Each one must be wrong in this context, not merely less likely. A form that exists in some register, formal, dated or regional ("take breakfast", "Have you a…?"), is not plainly wrong: do not use it.
- **Do not test a textbook distinction that natives ignore.** "Will" against "be going to" for a decision, or the simple present against the present continuous for a booked appointment: natives accept both, so neither is plainly wrong.
- **A tense question must offer the competing tense.** If the time marker alone eliminates every distractor ("yesterday" against present forms), the question tests the marker, not the rule. Offer the tense that competes for the same time (simple past against past continuous, present perfect against simple past) and let the context decide.
- **A choice question must test its rule.** If a distractor fails only on agreement (has vs have) while the question is tagged with a usage rule, the question tests form, not the rule. Then retag it or change the distractors.
- **Typed brackets must leave the rule's choice to the student.** "(might / not / come)" gives every word of the answer: the student only assembles them. Give the verb, and let the student choose the modal, the tense or the form the rule is about.
- **Typed**: list every accepted form in `answers` (full and contracted forms are handled by the normalisation; list real alternatives such as "has been" and "has ever been"). Do not give the auxiliary in the prompt when the rule is about choosing the tense; giving it is fine when the rule is the participle or the form.
- **Reorder**: every correct sentence that can be built from the tiles, with or without decoys, and with tiles left out, must be in `answers` and must translate the prompt. Prefer irregular verbs whose past and participle differ, so that leaving out an auxiliary gives a broken sentence. Punctuation glued to the last tile fixes where the sentence ends, so do not list an order that would need it elsewhere.

## Explanations

- In French, correct, natural, and consistent with the workbook's rule.
- Never state a rule more broadly than it is true. "Be est toujours suivi de -ing" is false because of the passive. "Be s'emploie seulement devant un adjectif" is false because of the age (be ten). Say "dans la forme progressive", "ici", or name the cases.
- Say why the right answer is right, and name the trap (the French calque, the wrong tense) when there is one.
- Use « » quotation marks and the French spacing before `:` `;` `!` `?`.
- One to three sentences.

## Self-check

Run `pnpm --dir /Users/avictoor/code/pokemon-anglais content:check --no-verdicts` and fix every problem it lists. It checks the schema, the rule ids, duplicated ids, blanks, and that reorder tiles spell the first answer.
