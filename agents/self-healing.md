# Self-Healing

When enabled, Tackle listens for failed queue jobs and failed scheduled
commands, dispatches an AI agent to diagnose the exception, patch the code,
verify the fix with your test suite, and either open a pull request or apply
the fix directly — all without you lifting a finger.

## How it works

1. A job fails → Laravel fires the `JobFailed` event.
2. Tackle's `JobFailureListener` picks it up and dispatches a `HealJobFailure`
   job to the `healer` queue (a separate queue from your normal workers).
3. A dedicated queue worker picks up `HealJobFailure`. It:
   - Creates an **isolated git worktree** on a fresh branch
     (`tackle/heal-{id}`).
   - Spins up a `HealingAgent` pointed at that worktree.
   - Feeds the agent the exception class, message, stack trace, and (if
     [Telescope](https://laravel.com/docs/telescope) is installed) the full
     Telescope exception entry.
   - The agent reads the failing code, applies a minimal fix via `EditFile`,
     and runs your test suite to verify.
4. After the agent finishes:
   - **`pr` mode (default):** pushes the branch to GitHub and opens a pull
     request with the agent's reasoning as the description.
   - **`patch` mode:** merges the fix back into your main workspace branch and
     re-dispatches the original job.
5. The worktree is cleaned up regardless of outcome.

## Prerequisites

- Your project must be a **git repository** with a remote named `origin`.
- A **queue worker** must be running the `healer` queue (see below).
- For PR mode, a **GitHub personal access token** is required.
- For `patch` mode, the working tree must be clean when healing runs.

## Enabling the healer

Publish and run the migration, then enable via `.env`:

```bash
php artisan vendor:publish --tag="tackle-migrations"
php artisan migrate
```

```env
AI_CODE_HEALING_ENABLED=true
```

The event listeners register automatically once this is set to `true`.

## Starting the healer worker

The healer runs on a dedicated queue to avoid competing with your normal
workers:

```bash
php artisan queue:work --queue=healer
```

Run this alongside your existing workers. In production (Supervisor, Forge,
etc.) add a separate process group for the `healer` queue.

For local development, the healer slots neatly into a
[`@laravel/multiplex`](https://github.com/laravel/multiplex) tab next to the
rest of your stack:

```bash
npx @laravel/multiplex \
  'server,php artisan serve' \
  'queue,php artisan queue:listen' \
  'vite,npm run dev' \
  'healer@green,php artisan queue:work --queue=healer'
```

When a job throws in the `queue` tab, watch the `healer` tab diagnose it,
patch the code, and post the PR link — your dev environment healing itself.
(Multiplex spawns commands without stdin, so it suits the healer and
[`ai:run`](/agents/headless); the interactive `ai:code` and `ai:fix` sessions
need a real terminal.)

## GitHub token setup

For PR mode, Tackle needs a GitHub token with the `repo` scope.

**Resolution order:**

1. `GITHUB_TOKEN` in `.env` (or the `tackle.healing.github_token` config key)
2. GitHub CLI (`~/.config/gh/hosts.yml`) — if you have `gh` installed and
   authenticated, Tackle reads your token automatically with no extra config.
3. If no token is found, the branch is pushed but the PR is not opened. A log
   entry records that you need to configure a token.

```env
GITHUB_TOKEN=ghp_...
```

## Configuration

All healer options live under the `healing` key in `config/tackle.php`:

| Option | Env var | Default | Description |
|---|---|---|---|
| `enabled` | `AI_CODE_HEALING_ENABLED` | `false` | Enable or disable the healer |
| `mode` | `AI_CODE_HEALING_MODE` | `pr` | `pr` = open a pull request; `patch` = apply directly |
| `queue` | `AI_CODE_HEALING_QUEUE` | `healer` | Queue name for the `HealJobFailure` job |
| `threshold` | `AI_CODE_HEALING_THRESHOLD` | `1` | Number of failures before healing triggers |
| `base_branch` | `AI_CODE_HEALING_BASE_BRANCH` | `main` | Branch PRs are opened against |
| `branch_prefix` | `AI_CODE_HEALING_BRANCH_PREFIX` | `tackle/heal-` | Prefix for fix branches |
| `github_token` | `GITHUB_TOKEN` | — | GitHub token for opening PRs |
| `telescope` | `AI_CODE_HEALING_TELESCOPE` | `true` | Use Telescope context if available |

## Failure threshold

By default (`threshold=1`) the healer triggers on the first failure. If you
want the healer to wait until a job has failed a certain number of times
before intervening (e.g. to let transient failures resolve themselves), set:

```env
AI_CODE_HEALING_THRESHOLD=3
```

## PR mode vs patch mode

| | `pr` (default) | `patch` |
|---|---|---|
| Human review required | Yes — merge the PR | No — merged automatically |
| Tests must pass | No (PR opened regardless) | Yes (only merges on green) |
| Job re-dispatched | No | Yes, after merge |
| Best for | Production / sensitive code | CI environments / trusted agents |

## Laravel Telescope integration

If [Laravel Telescope](https://laravel.com/docs/telescope) is installed in
your application, Tackle uses it to give the agent richer context: the full
exception entry including class, message, and stack frames. No extra
configuration is needed — Tackle detects Telescope automatically and degrades
gracefully if it is not present.

## Scheduled command healing

Tackle also listens to the `ScheduledTaskFailed` event, which Laravel fires
when a task registered in `App\Console\Kernel::schedule()` (or a `Schedule`
class) throws an exception.

The healing flow is identical to queue jobs — an isolated git worktree, an AI
agent, a test run, then a PR or patch. The one difference: scheduled tasks are
not re-dispatched after a patch (they run on their own schedule). The fix
simply takes effect the next time the task runs.

No extra configuration is needed beyond `AI_CODE_HEALING_ENABLED=true`.

## Per-class opt-out

Some jobs should never be auto-patched — payment processors, email senders,
anything where an untested change would be worse than the failure. Use the
`#[Healable(false)]` attribute to opt out:

```php
use Tackle\Attributes\Healable;

#[Healable(false)]
class ChargeSubscription implements ShouldQueue
{
    public function handle(): void
    {
        // Tackle will skip this job entirely — even when AI_CODE_HEALING_ENABLED=true.
    }
}
```

The listener checks for the attribute via reflection before dispatching a heal
job. Jobs without the attribute, or with `#[Healable(true)]`, are healed
normally.

## Audit log

Every healing attempt — successful or not — is written to the
`tackle_healing_log` table. View recent entries with:

```bash
php artisan tackle:healing-log
```

The table output shows when, what failed, whether tests passed, the outcome,
and a link to the PR or branch:

```
+-------------+----------------+--------------------+-----------+-------+------------+
| When        | Type           | Subject            | Tests     | Out.  | PR / Branch|
+-------------+----------------+--------------------+-----------+-------+------------+
| 2 mins ago  | job            | BrokenJob          | ✗         | PR    | github.com/|
| 1 hour ago  | scheduled_task | SendWeeklyReport   | ✓         | patched| tackle/... |
+-------------+----------------+--------------------+-----------+-------+------------+
```

**Filters:**

```bash
# Show only job failures
php artisan tackle:healing-log --type=job

# Show only scheduled task failures
php artisan tackle:healing-log --type=scheduled_task

# Show only successful patches
php artisan tackle:healing-log --outcome=patched

# Show only PR-mode results
php artisan tackle:healing-log --outcome=pr_opened

# Show more entries
php artisan tackle:healing-log --limit=50
```

The audit log requires the migration to have been run:

```bash
php artisan vendor:publish --tag="tackle-migrations"
php artisan migrate
```

If the migration has not been run, healing continues normally — the log write
degrades gracefully.

## Replaying a healing attempt

Use [`tackle:replay`](/reference/commands#tackle-replay) to re-dispatch a
previous healing attempt after adjusting config or fixing something manually.

## Healer limitations

- The healer targets **code bugs** — logic errors the AI can diagnose and
  fix. It is not designed for infrastructure issues (database down, disk
  full, etc.).
- The fix branch is pushed to `origin` — your CI pipeline will run on it and
  can catch anything the local test run missed.
- In `patch` mode, if tests fail the healer falls back to PR mode
  automatically so nothing is merged without verification.
- The healer never modifies `.env`, `vendor/`, `storage/`, or `.git/` — the
  same path guards apply as in interactive mode.
- Healer jobs have `$tries = 1`. A failing healer does not create a healing
  loop.
