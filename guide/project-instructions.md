# Project Instructions (TACKLE.md)

Every Tackle agent — `ai:code`, `ai:fix`, `ai:review`, `ai:explain`, `ai:test`,
`ai:upgrade`, and the self-healer — loads a `TACKLE.md` file from your project
root at the start of each session and follows it. It's the place to record
project conventions, boundaries, and gotchas once, instead of repeating them in
every prompt.

## Generate a starter file

```bash
php artisan tackle:init
```

This scans your project (composer.json, test framework, Pint/Larastan presence,
`app/` structure) and writes a scaffold with `## Conventions`, `## Boundaries`,
and `## Gotchas` sections for you to fill in. Use `--force` to overwrite an
existing file.

## Example content

```markdown
## Conventions

- All money values are integer cents — never floats.
- New endpoints validate through Form Requests, never inline `validate()`.

## Boundaries

- Never modify files under `app/Legacy/` — scheduled for deletion.
- Do not add new composer dependencies without asking first.

## Gotchas

- `User::active()` excludes soft-deleted AND suspended users.
```

## Notes

- If no `TACKLE.md` exists, Tackle falls back to `AGENTS.md`, then `CLAUDE.md`
  — so instructions you already maintain for other AI tools work out of the
  box.
- Content is capped at 20,000 characters to protect your context window and
  session budget; anything beyond that is truncated.
- Project instructions never override Tackle's [safety layer](/guide/safety) —
  protected paths, shell modes, and allowlists are enforced in PHP regardless
  of what the file says.
