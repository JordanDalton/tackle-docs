# Troubleshooting

## `HTTP request returned status code 401`

Your API key is incorrect or revoked. A *missing* key no longer gets this
far: since v1.56.1 every streaming command checks the configured provider's
key before the first request and fails immediately with a message naming the
provider and the variable to set — so a 401 usually means the key exists but
is wrong. Check `ANTHROPIC_API_KEY` (or the key for your chosen provider) in
the environment the run executes in — for CI runs, the secret your workflow
passes.

## `Agent error: ...` and the session continues

The agent caught an exception during a turn. The error is shown but the
session stays alive — type your next task to continue. If the same error
repeats, check the message for clues (auth issues, missing binaries,
filesystem permissions).

## `Session aborted: estimated cost exceeds the budget limit`

You've hit the `budget_usd` cap. Increase it in `.env`:

```env
AI_CODE_BUDGET=5.00
```

Or pass a higher limit for a single session by editing the config temporarily.
The default $1.00 limit is intentionally conservative.

## `ai:code requires an interactive TTY`

`ai:code` is an interactive REPL and must be run in a real terminal — not
piped, not in a CI job, not through a non-interactive shell, because its
approval prompts need user input.

For pipes, CI jobs, and cron, use [`ai:run`](/agents/headless) instead. It
runs the same agent with the same tools and reports a structured result and an
exit code.

## `Path '...' is outside the workspace root`

The agent tried to access a file outside the configured workspace (defaults to
`base_path()`). If you're working in a monorepo or non-standard layout, set
`workspace` in `config/tackle.php` to the correct root path.

## `Path '...' matches protected pattern`

The agent tried to read or write a protected file (`.env`, `vendor/`, etc.).
This is intentional — protected paths are blocked in code, not via prompting.
If you need to unblock a path (e.g. you're working on a package inside
`vendor/`), remove or narrow the relevant pattern in `protected_paths`.

## `old_str not found` / `old_str appears N times`

The agent is trying to edit a file but the string it wants to replace either
doesn't exist or appears more than once. This usually means the agent needs to
re-read the file to get the current content. Tell it: "read the file again
before editing."

## `Pint is not installed`

Install Pint as a dev dependency in the host app:

```bash
composer require laravel/pint --dev
```

## Tests fail during a session

This is expected behaviour. When `RunTests` returns failures, the agent reads
the output and attempts to fix the code. If it gets stuck, tell it what the
failure means or paste the relevant stack trace as your next message.

## Healer branch is pushed but no PR is opened

Tackle could not find a GitHub token. Check the resolution order:

1. `GITHUB_TOKEN` in `.env`
2. GitHub CLI: run `gh auth status` — if it shows "not logged in", run `gh auth login`
3. `tackle.healing.github_token` in `config/tackle.php`

## `git worktree add failed`

This means either:

- The project is not inside a git repository. Run
  `git init && git commit -am "initial"`.
- The branch name already exists. Delete it:
  `git branch -D tackle/heal-<id>` and retry.

## Healer ran but didn't fix the bug

The agent's fix will be in the PR (or logged). Review the PR description for
the agent's reasoning. If the diagnosis was wrong, close the PR and fix it
manually — the agent's attempt gives you a starting point and a working
branch to build on.

## Healer triggered a loop

`HealJobFailure` has `$tries = 1`, so a failing healer cannot create a loop
with itself. If you see repeated healer jobs it means the original job keeps
failing and `threshold` is set to 1. Raise the threshold or disable healing
until the root cause is resolved:

```env
AI_CODE_HEALING_ENABLED=false
```
