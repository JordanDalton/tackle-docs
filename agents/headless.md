# Headless Runs (ai:run)

`ai:code` is a REPL and needs a terminal. `ai:run` is the same agent, the same
tools, and the same safety layer — run once, to completion, with nothing
attached to stdin. Built for CI, cron, and scripts.

```bash
php artisan ai:run "Add a scopeActive to the Subscription model and a test for it"
```

It streams a plain-text log while it works and prints a summary at the end.

## Machine-readable output

`--output=json` prints one JSON document on stdout. Diagnostics go to stderr,
so you can pipe stdout straight into `jq` without filtering.

```bash
php artisan ai:run "Fix the failing SubscriptionTest" --output=json | jq -r '.pr_url'
```

```json
{
  "ok": true,
  "outcome": "completed",
  "text": "Added the scope and a test covering both branches.",
  "steps": 12,
  "files_changed": ["app/Models/Subscription.php", "tests/Feature/SubscriptionTest.php"],
  "diff_stat": "2 files changed, 24 insertions(+)",
  "interactions_denied": 0,
  "usage": { "input_tokens": 41233, "output_tokens": 2210, "estimated_cost_usd": 0.1563 },
  "budget_usd": 1.0,
  "worktree": "/tmp/tackle-worktree-9f2ab1c4",
  "pr_url": "https://github.com/acme/app/pull/218",
  "events": [
    { "type": "tool_call", "tool": "EditFile", "args": { "path": "app/Models/Subscription.php" } }
  ]
}
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0`  | Completed |
| `1`  | Agent or provider error, or an invalid option |
| `2`  | Stopped — the spend limit was reached |
| `3`  | A confirmation was auto-denied (only with `--fail-on-denied`) |
| `4`  | Hit the step ceiling without finishing |

## Confirmations without a user

Five tools ask before they act: `AskUser`, `ConfirmAction`, `RunArtisan` (for
destructive commands), `RunShell` (under `shell=approve`), and
`CommitAndPush`. With no terminal there is nobody to answer, so **every
confirmation is denied by default** — nothing that would have needed a human
"yes" happens without one.

`AskUser` is the exception, because it is a choice rather than a confirmation:
the agent is told to pick the option it judges best, say which it chose and
why, and carry on. A denied *choice* would just stall the run.

Pass `--yes` to approve automatically instead. Only do that where you would
have clicked through the prompts yourself — it green-lights destructive
Artisan commands and pushes.

`--fail-on-denied` turns any auto-denial into exit code 3, for pipelines that
would rather fail loudly than get a partial result. Either way, the count is in
the JSON as `interactions_denied`.

## Shell in unattended runs

`shell=approve` — the config default for `local` and `staging` — has no meaning
with no one to approve. Rather than silently promote it to `yolo`, `ai:run`
refuses those commands and says why. For a run that genuinely needs a shell,
choose the policy deliberately:

```bash
php artisan ai:run "..." --allowlist   # only shell_allowlist commands
php artisan ai:run "..." --yolo        # unrestricted — trusted environments only
```

## Bounding a run

`--budget` and `--max-steps` override `budget_usd` and `max_steps` for one run.
Both are hard stops: the run aborts and reports the outcome rather than
continuing past the limit.

```bash
php artisan ai:run "..." --budget=0.50 --max-steps=25
```

::: info A ceiling, not a grant
`max_steps` is a ceiling, not a grant. Each agent also declares its own
`#[MaxSteps]` attribute, which `laravel/ai` reads by reflection and which
cannot be raised at runtime — setting `max_steps` above it has no effect.
:::

## In GitHub Actions

Worktree mode is worth forcing here: the agent edits an isolated copy and the
live checkout is never touched.

```yaml
name: Tackle
on:
  workflow_dispatch:
    inputs:
      task:
        description: What should Tackle do?
        required: true

jobs:
  run:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
      - run: composer install --no-interaction --prefer-dist
      - name: Run Tackle
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPO: ${{ github.repository }}
        run: |
          php artisan ai:run "${{ inputs.task }}" \
            --output=json \
            --worktree \
            --allowlist \
            --budget=2.00 \
            --max-steps=60 > result.json
      - run: jq -r '.text' result.json >> $GITHUB_STEP_SUMMARY
        if: always()
```

The job fails on any non-zero exit, so a run that blows the budget or hits the
step ceiling fails the workflow rather than reporting success with half the
work done.

::: tip Prefer a packaged action?
The [Tackle Review action](/integrations/review-action) wraps checkout, PHP
setup, Composer install, and the run in one step — including a `run-type: task`
mode that executes `ai:run` for you.
:::
