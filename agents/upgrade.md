# Dependency Upgrades (ai:upgrade)

`php artisan ai:upgrade` performs a major version upgrade of a Composer
package — Laravel itself included — the way a careful human would, with the
safety boundaries enforced in PHP.

```bash
# What could be upgraded, and what blocks each one? Deterministic, no AI involved.
php artisan ai:upgrade --audit

# Same audit, mirrored to a GitHub issue — built for the scheduler
php artisan ai:upgrade --audit --issue

# Upgrade one package across a major version
php artisan ai:upgrade laravel/framework

# Upgrade several — sequential isolated sessions, one PR each
php artisan ai:upgrade pestphp/pest spatie/laravel-permission

# No package? Multi-select from the audit interactively.
php artisan ai:upgrade
```

## The playbook

The session follows a fixed playbook:

1. **Audit** — `composer outdated` establishes what is installed and what is
   available; `composer why-not` names the packages whose constraints block
   the jump.
2. **Plan** — the agent reads the package's `UPGRADE.md` / `CHANGELOG.md` from
   `vendor/` (a narrow, docs-only carve-out of the `vendor/*` protected path),
   searches your code for actual usages, and presents a plan covering only the
   breaking changes that affect *your* app. Nothing mutates until you confirm.
3. **Resolve** — the constraint is bumped and
   `composer update --with-all-dependencies` runs. Solver conflicts are
   diagnosed with `why-not` and the blockers raised iteratively.
4. **Fix** — the code and config changes the upgrade guide requires, as
   minimal edits.
5. **Verify** — your test suite, Larastan if installed, a boot smoke check,
   and Pint.
6. **Deliver** — an honest summary (including which upgrade-guide items did
   *not* apply, and what your tests do *not* cover) and an offer to open a PR.

## What makes it safe

- **Worktree by default.** The whole upgrade — lockfile, `vendor/`, code
  edits — happens in an isolated git worktree. A failed resolution can never
  leave your live checkout broken. Opt out with `--no-worktree`.
- **Lifecycle scripts stay off.** Every composer mutation runs `--no-scripts`
  (composer scripts are arbitrary project PHP — the same path
  `ComposerScriptGuard` blocks). Scripts run only when a human approves them
  in the terminal, after the lockfile change is reviewable.
- **Composer is fenced.** The agent's composer tool permits a fixed set of
  subcommands and refuses `--working-dir` / `--global`; `run-script` and
  `exec` are not available at all.
- **Green ≠ proven.** The final summary is required to say what the test
  suite did not exercise, rather than declaring the upgrade safe on a thin
  green run.

## One major per session

For a framework major that forces ecosystem packages to move together, the
plan lists the full set before anything changes — that is one atomic change
and one PR. **Independent majors are a different case**: pass several packages
(or multi-select from the audit) and each runs as its own sequential session
with a fresh agent context, fresh worktree, and fresh budget, delivering one
PR per package — so a bad upgrade stays individually reviewable, bisectable,
and revertable. Each session's prompt fences the scope to its own package, and
every upgrade PR touches `composer.lock`, so after merging one, rebase the
next and re-run `composer update` on its branch.

::: tip Budget
Major upgrades are long sessions — consider raising `AI_CODE_BUDGET` beyond
the default $1 before starting one; in a batch the budget applies per package,
not to the batch as a whole.
:::

## Scheduled dependency watch

The audit needs no AI, no TTY, and costs nothing, so it is safe to run on the
scheduler. With `--issue` it maintains **exactly one** GitHub issue mirroring
the audit (requires `GITHUB_TOKEN` + `GITHUB_REPO`):

```php
// routes/console.php
Schedule::command('ai:upgrade --audit --issue')->daily();
```

- The first time majors appear, an issue titled *"Composer major upgrades
  available"* is opened (labelled `tackle-upgrade-audit`), listing each
  package with its `why-not` blockers.
- When the audit changes, the issue body is updated in place. When it hasn't,
  nothing is written — no daily notification spam.
- When no major upgrades remain (you upgraded, or constraints resolved), the
  issue is commented on and closed.

The issue is the reminder; a human stays the trigger — read it and run
`php artisan ai:upgrade <package>` to turn it into a PR, or wire up the
unattended mode below.

## Unattended upgrades (--headless)

```bash
php artisan ai:upgrade pestphp/pest --headless --output=json --ref-issue=42
```

Headless mode runs the same playbook with no terminal: the plan-confirmation
step is folded into the PR body, verification still gates delivery, and the PR
opens automatically — **the pull request is the human gate**, the same trust
model as the self-healer's `mode=pr`. `--ref-issue=N` makes the PR body carry
`Refs #N` (not `Closes` — the audit issue closes itself once no majors
remain).

Safety properties specific to headless:

- **Composer lifecycle scripts can never run.** Enabling them requires an
  *interactive* approval, and the headless interaction policy is permanently
  non-interactive — there is no flag that overrides this.
- Explicit targets only: headless refuses to pick packages itself.
- Budget (`--budget`, per package) and step ceiling (`--max-steps`) abort the
  run with distinct exit codes: `0` ok, `1` error, `2` budget, `4` max steps.
- `--output=json` emits one JSON document per package on stdout (progress
  goes to stderr): outcome, steps, diff stat, token usage, and `pr_url`.

## Label-triggered upgrades in CI

A label-triggered GitHub Actions workflow closes the loop — the scheduler
maintains the issue, a maintainer applies the `tackle-upgrade` label, CI opens
the PR. The ephemeral runner with a scoped `GITHUB_TOKEN` is stronger
containment than any in-process guard:

```yaml
name: tackle-upgrade
on:
  issues:
    types: [labeled]
permissions:
  contents: write
  pull-requests: write
  issues: read
concurrency: tackle-upgrade
jobs:
  upgrade:
    if: github.event.label.name == 'tackle-upgrade'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: { php-version: '8.4' }
      - run: composer install --no-interaction --no-scripts
      - run: |
          php artisan ai:upgrade pestphp/pest \
            --headless --output=json --no-worktree \
            --ref-issue=${{ github.event.issue.number }} \
            --budget=3
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPO: ${{ github.repository }}
          AI_CODE_GUARD_INJECTION: true
```

(`--no-worktree` because the checkout is already disposable. The label gate
matters: issue bodies are untrusted input, so only maintainer action — a
label they applied — may hand an agent write access. Enabling the
[injection classifier](/guide/safety#injection-shield-experimental) fences
what the issue reader returns.)

The [Tackle Review action](/integrations/review-action#upgrading-dependencies-from-an-issue-run-type-upgrade)
packages this workflow as `run-type: upgrade`.
