# Code Review (ai:review)

`php artisan ai:review` feeds your git diff to a read-only AI agent that reads
the surrounding codebase for context, then surfaces real issues grouped by
file with severity levels.

```bash
# Review everything since your last commit (staged + unstaged)
php artisan ai:review

# Review only staged changes
php artisan ai:review --staged

# PR-style review — your branch vs. another branch
php artisan ai:review --against=main

# Review a specific commit
php artisan ai:review --commit=abc1234

# Tell the agent what to prioritise
php artisan ai:review --against=main --focus=security,performance

# Review a GitHub pull request (diff fetched via the GitHub API)
php artisan ai:review --pr=42

# …and post the findings back to the PR as inline review comments
php artisan ai:review --pr=42 --comment
```

## Output format

Findings are grouped by file with three severity levels:

| Level | Meaning |
|---|---|
| 🔴 Critical | Bugs that will cause failures, security vulnerabilities, data loss risks |
| 🟡 Warning | Edge cases, missing error handling, performance concerns, breaking changes |
| 🟢 Suggestion | Improvements worth considering but not blocking |

The review ends with a one-line verdict: **LGTM** / **LGTM with minor notes** /
**Needs changes**.

## How it works

The `ReviewAgent` is a read-only agent — it has access to `ReadFile`, `Glob`,
and `SearchCode` but no editing tools. Before commenting on any changed
function or class it reads the full file for context, so findings are grounded
in the actual codebase rather than the diff alone.

## Focus areas

Pass `--focus` with a comma-separated list to direct the agent's attention:

```bash
php artisan ai:review --focus=security
php artisan ai:review --focus=performance,tests
php artisan ai:review --staged --focus=bugs,security
```

Any plain-language description works — `security`, `performance`,
`n+1 queries`, `missing tests`, `breaking changes`, etc.

## Reviewing pull requests

`--pr=N` reviews a GitHub pull request instead of a local diff. The diff is
fetched from the GitHub API, so it works regardless of which branches exist in
your local checkout — the checkout is only used by the agent's read tools to
understand the surrounding code. Requires `GITHUB_TOKEN` and `GITHUB_REPO`
(see [GitHub Issues integration](/integrations/github)); the token needs
**Pull requests: read** permission, or **read & write** when using
`--comment`.

```bash
# Print the review to the terminal
php artisan ai:review --pr=42

# Post it to the PR as a single review with inline comments
php artisan ai:review --pr=42 --comment
```

With `--comment`, each finding is anchored to the exact file and line as an
inline review comment (🔴/🟡/🟢 severity included), under a summary body with
the overall verdict. Findings that reference lines outside the diff are folded
into the summary instead of being dropped.

## Incremental re-reviews

Re-running `ai:review --pr` on a PR Tackle has already reviewed does **not**
repeat the whole review. Each posted review embeds an invisible marker
recording the head commit it covered; on the next run Tackle finds it and:

- reviews **only the changes pushed since the last review** (via the GitHub
  compare API),
- tells the agent what it already reported, so findings aren't repeated,
- labels the posted review as a follow-up,
- and exits early with "Nothing new to review" when the head commit is
  unchanged.

If the previously reviewed commit was force-pushed away and the compare can't
be resolved, Tackle falls back to a full review automatically. Pass `--full`
to force a full re-review at any time:

```bash
php artisan ai:review --pr=42 --comment --full
```

This makes a `pull_request`-triggered workflow cheap to run on `synchronize`:
each push reviews only its own delta instead of the entire PR again.

## Gating CI on the review

`--fail-on` makes the command exit non-zero when findings at or above the
given severity exist, so a workflow can block a merge:

```bash
php artisan ai:review --pr=42 --comment --fail-on=critical   # fail on critical only
php artisan ai:review --pr=42 --fail-on=warning              # fail on critical or warning
```

`--fail-on` also works for local scopes (`--staged`, `--against=main`, …) —
useful in pre-push hooks.

## Machine-readable review output

As with [`ai:run`](/agents/headless), `--output=json` prints one JSON document
on stdout — diagnostics (including the review prose) go to stderr — so stdout
pipes straight into `jq`. JSON mode always requests the structured findings
block, so `verdict` and `findings` are populated even without `--comment` or
`--fail-on`. Exit codes are unchanged.

```bash
php artisan ai:review --pr=42 --output=json | jq -r '.verdict'
```

```json
{
  "ok": true,
  "outcome": "completed",
  "error": null,
  "verdict": "needs_changes",
  "findings": [
    { "path": "app/Models/Subscription.php", "line": 42, "severity": "critical", "message": "Unchecked null." }
  ],
  "text": "The review prose, without the findings block.",
  "head_sha": "9f2ab1c4…",
  "pr_number": 42,
  "usage": { "input_tokens": 41233, "output_tokens": 2210, "estimated_cost_usd": 0.1563 }
}
```

`outcome` is `completed`, `nothing_to_review`, `findings_gate_failed`
(`--fail-on` tripped), or `error`. For local scopes, `head_sha` and
`pr_number` are `null`.

## Reviewing every PR automatically

The easiest path is `php artisan tackle:install review`, which scaffolds
`.github/workflows/tackle-review.yml` using the
[Tackle Review action](/integrations/review-action) — add the
`ANTHROPIC_API_KEY` secret to the repository and every PR gets reviewed. The
generated workflow wraps the whole job in one step:

```yaml
name: Tackle Review
on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: JordanDalton/tackle-review@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          fail-on: critical   # optional — omit for an advisory review
```

Or hand-roll the equivalent workflow in `.github/workflows/tackle-review.yml`:

```yaml
name: Tackle Review
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
      - run: composer install --no-interaction --prefer-dist
      - name: Review the pull request
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPO: ${{ github.repository }}
        run: |
          php artisan ai:review \
            --pr=${{ github.event.pull_request.number }} \
            --comment \
            --fail-on=critical
```

Notes:

- `pull-requests: write` is what lets the default `GITHUB_TOKEN` post the
  review.
- Drop `--fail-on=critical` if you want the review to be advisory rather than
  blocking.
- The review agent is read-only and the diff comes from the API, so the job
  needs no database and no `--yes`-style approval flags.

## Acting on review comments (/tackle)

`ai:respond` closes the loop from *found* to *fixed*. When a reviewer replies
to a finding (or leaves any PR comment) asking Tackle to act, the command
loads the comment, its thread, and the diff context, runs the coding agent
against the instruction, pushes the resulting commit to the PR branch, and
replies in the thread:

```bash
php artisan ai:respond --pr=42 --comment-id=123456 --comment-type=review

# Machine-readable result — one JSON document on stdout, diagnostics on stderr
php artisan ai:respond --pr=42 --comment-id=123456 --output=json
```

- `--comment-type=review` for inline review comments (the usual case),
  `--comment-type=issue` for comments in the PR conversation tab.
- `--output=json` reports `ok`, `outcome`, `error`, `pr_number`,
  `comment_id`, `reply_posted`, `pushed`, and `usage` — the same
  stdout/stderr discipline and usage shape as `ai:run`. Exit codes are
  unchanged.
- If the comment asks a question rather than requesting a change, the agent
  answers in the thread and touches nothing.
- The reply always arrives — success (with the pushed SHA and diff stat),
  no-op, or a clear failure message. Threads never dangle.

Guardrails, enforced in PHP:

- **Fork PRs are refused** — Tackle never pushes to a branch in someone
  else's repository; it replies explaining why instead.
- **The checkout must match the PR head** — the agent edits the working tree
  and the result is pushed, so a mismatched checkout aborts before the agent
  runs. In CI, check out `refs/pull/<n>/head`.
- Confirmations are auto-denied as in `ai:run`; pass `--yes` only where you
  would have approved them yourself.

The easiest way to wire this to GitHub is the `respond` action — see
[Tackle Review](/integrations/review-action#acting-on-review-comments-tackle-fix-this).
Gate the workflow on `author_association` so only maintainers can trigger it.
