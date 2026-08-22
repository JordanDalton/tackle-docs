# Onboard a Developer (ai:onboard)

`php artisan ai:onboard` gives a new developer the first-day tour a senior
teammate would — read-only, built from what is actually in the repository,
with file paths throughout so they can open what it describes. Then it stays
open to answer their questions about the codebase.

```bash
# The full tour, then a Q&A prompt
php artisan ai:onboard

# Tour one area in depth — a directory, module, or domain concept
php artisan ai:onboard --focus=app/Billing
php artisan ai:onboard --focus="checkout"

# Skip the tour and go straight to questions
php artisan ai:onboard --ask

# Save the tour as docs/ONBOARDING.md (or a path of your choice)
php artisan ai:onboard --write
php artisan ai:onboard --write=docs/architecture/TOUR.md
```

## What the tour covers

The agent works through a fixed set of sections, each built from evidence in
the repo — never from framework defaults — and cites the files it describes:

1. **What this app is** — the product or purpose and the core domain nouns.
2. **How it is put together** — the layout and architectural pattern actually
   in use, the load-bearing packages, and how a request flows for the two or
   three most important routes.
3. **Entrypoints** — key routes, console commands, queued jobs, scheduled
   tasks, events and listeners, webhooks — and the class that handles each.
4. **Data model** — the core models, how they relate, and anything unusual
   in the migrations.
5. **Running it locally** — setup from `.env.example`, composer scripts,
   Sail/Herd/Docker hints, seeders, the test suite, asset builds.
6. **Conventions** — as observed, with an example file each: test style,
   Pint preset, static analysis level, validation style, enums, API
   resources, how auth is wired.
7. **Where to be careful** — files that change most, skipped or missing
   tests, deprecations and TODO clusters, anything the team's own
   instructions flag, integrations that need credentials.
8. **Good first tasks** — a few small, low-risk places to start.

Sections with nothing to say get one honest line ("no scheduler") rather than
filler. After the tour, the prompt stays open: "where is the refund logic?",
"how does API auth work?" — answered from the code, with the same citations.

## Keeping the document fresh

`--write` works without a terminal, so the onboarding doc can be regenerated
by the scheduler or CI instead of rotting the way hand-written ones do:

```php
// routes/console.php
Schedule::command('ai:onboard --write')->weekly();
```

If the provider cuts the stream short (a mid-stream error, or the output
length limit), nothing is written and the command exits non-zero — a scheduled
run never replaces a complete document with a partial one.

The file opens with a comment naming the command that generated it. `--write`
must point inside the project and at a `.md` file.

## How it behaves

- **Read-only.** The agent has `ReadFile`, `Glob`, `SearchCode`, `ListRoutes`
  and — when the [`explorer` subagent](/extending/subagents) is registered —
  `Delegate`, so broad sweeps happen in a subagent and the main conversation
  stays clean for your questions. It never edits files or runs shell commands.
- **No suggestions.** Anything risky is described as a place to be careful,
  not a task. Use [`ai:review`](/agents/review) or
  [`ai:code`](/agents/interactive) when you want changes.
- **Your instructions are the source of truth.** It reads
  [`TACKLE.md`](/guide/project-instructions) (or `AGENTS.md` / `CLAUDE.md`)
  and quotes the team's conventions and warnings rather than restating them.
- **`--focus` stays in its lane.** The tour covers only the area you name and
  mentions the rest of the app only where that area touches it.
- **Budget and model flags** work as elsewhere: `--model`, `--provider`, and
  the session budget from `tackle.budget_usd`.

::: tip One file or the whole app?
[`ai:explain`](/agents/explain-and-test) explains a single file, class, or
method. `ai:onboard` is the whole-application version, with a narrative and
a prompt that stays open for questions.
:::
