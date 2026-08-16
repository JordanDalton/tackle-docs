# Interactive Coding (ai:code)

```bash
php artisan ai:code
```

`ai:code` is the interactive coding agent — a REPL in your terminal that reads
your codebase, edits files, runs tests, and formats code, maintaining full
conversation history within the session.

New to Tackle? Start with [Your First Session](/guide/first-session).

## Shell mode flag

Pass `--shell` to override the configured
[shell mode](/guide/configuration#shell-modes) for a single session without
touching your config or `.env`:

```bash
# Safe read-only exploration — no commands will run at all
php artisan ai:code --shell=off
php artisan ai:code --off          # shorthand

# Require your approval before every shell command (config default)
php artisan ai:code --shell=approve
php artisan ai:code --approve      # shorthand

# Only allow commands from shell_allowlist, no prompt
php artisan ai:code --shell=allowlist
php artisan ai:code --allowlist    # shorthand

# No restrictions, no prompts — CI or fully-trusted environments only
php artisan ai:code --shell=yolo
php artisan ai:code --yolo         # shorthand
```

The flag is session-scoped and does not persist to config.

## Worktree mode

Worktree mode runs the agent against an isolated git worktree rather than your
live files. All edits land in a temp directory; nothing touches your working
tree until you open a PR.

```bash
php artisan ai:code --worktree      # force on for this session
php artisan ai:code --no-worktree   # force off for this session
```

When active, the intro line shows `· worktree: on` and a note box explains that
live files are untouched. After each turn, the git diff stat is labelled
**"Worktree changes (live files untouched)"** so it's clear no production code
has been modified.

Production environments default to `worktree: on` (see
[Configuration](/guide/configuration)). Worktrees are cleaned up automatically
when the session ends. Use [`tackle:prune`](/reference/commands#tackle-prune)
to remove any that were left behind by interrupted sessions.

## Plan mode

Have the agent think before it touches anything. In plan mode a **read-only**
planning agent investigates the codebase and streams a numbered implementation
plan — files, changes, risks. Nothing is edited until you approve it.

```bash
php artisan ai:code --plan     # every task plans first
```

Or plan a single task from inside the REPL:

```
> /plan add soft deletes to the Invoice model
```

After the plan streams you choose: **Execute** (the coding agent follows the
approved plan), **Revise** (describe what to change; the planner tries again),
or **Cancel**. One approval replaces a session of per-edit vigilance.

## Slash commands

The `ai:code` prompt understands commands. Type `/` to autocomplete them:

| Command | What it does |
|---|---|
| `/plan <task>` | Plan first, edit only after your approval |
| `/model [name]` | Switch the model mid-session — no name shows a picker listing known models with their per-MTok rates. `/model <provider> <model>` switches provider too. Budget rates update automatically for known models. |
| `/compact` | Summarize older session history to free context |
| `/clear` | Forget the session history entirely |
| `/sessions` | List saved sessions and how to resume them |
| `/help` | List all commands, including your project's own |
| `/<name> [args]` | Run a [custom command](#custom-commands-tackle-commands) from `.tackle/commands` |

## Custom commands (.tackle/commands)

Reusable prompts your whole team shares, checked into the repo. Drop a markdown
file in `.tackle/commands/` and its name becomes a command:

```markdown
<!-- .tackle/commands/deploy-check.md -->
Review everything changed since the last tag for deploy risk: migrations that
lock tables, config that needs new env vars, breaking API changes. Focus on: $ARGUMENTS
```

```
> /deploy-check the billing module
```

`$ARGUMENTS` is replaced with whatever follows the command name (or the
arguments are appended when the template has no placeholder). Custom commands
work headlessly too:

```bash
php artisan ai:run "/deploy-check the billing module"
```

## Context compaction

Long sessions re-send their whole history every turn — slower, costlier, and
eventually over the context limit. When the conversation exceeds
`AI_CODE_COMPACTION_THRESHOLD` (default 60,000 characters), Tackle summarizes
the older exchanges and keeps the last `AI_CODE_COMPACTION_KEEP` messages
verbatim, automatically. Force it any time with `/compact`, or start fresh with
`/clear`.

## Images

Drag an image into the terminal (which pastes its path), or type the path, or
`@`-mention one in the workspace — Tackle detects it, attaches the image to the
prompt, and the model sees the actual pixels:

```
> the header is misaligned, see /Users/me/Desktop/Screen\ Shot.png — fix the CSS
> build this component @docs/mock.webp
```

PNG, JPEG, GIF, and WebP are recognized; quoted paths and escaped spaces from
drag-and-drop both work. Requires a vision-capable model (the default Claude
models are; some local models are not).

## Interactive UX

`ai:code` uses [Laravel Prompts](https://laravel.com/docs/13.x/prompts)
throughout for a fully interactive terminal experience:

- **`suggest()`** — the task prompt shows your previous tasks as autocomplete suggestions. Use ↑↓ to browse history.
- **`stream()`** — AI text responses stream to the terminal in real time, token by token.
- **`title()`** — the terminal tab title updates dynamically as the agent works: "Tackle — Thinking…", "Tackle — Reading files", "Tackle — Running tests", "Tackle — Ready".
- **`select()` / `multiselect()`** — when the agent calls `AskUser`, you're presented with a styled selection list rather than a raw text prompt.
- **`confirm()`** — when the agent calls `ConfirmAction` before a destructive operation, you see a styled yes/no prompt.
- **`note()`** — after each turn a `git diff --stat` is shown as a note block so you can see what changed.
- **`warning()`** — a styled warning appears when you approach 80% of your session budget.
- **`error()`** — styled errors on agent failures or budget overruns.
- **`intro()` / `outro()`** — session start and end use styled banners showing the model, budget, and shell mode.
