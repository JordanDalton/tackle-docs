# Utility Commands

The agent commands (`ai:code`, `ai:run`, `ai:fix`, `ai:review`, `ai:respond`,
`ai:explain`, `ai:test`, `ai:upgrade`) each have their own page under
[The Agents](/agents/interactive). This page covers the supporting
`tackle:*` commands.

## tackle:init

Generates a starter [`TACKLE.md`](/guide/project-instructions) by scanning
your project (composer.json, test framework, Pint/Larastan presence, `app/`
structure):

```bash
php artisan tackle:init
php artisan tackle:init --force   # overwrite an existing file
```

## tackle:health

Verifies that the package is correctly set up. Run it after installation or
when something isn't working as expected.

```bash
php artisan tackle:health
```

It checks:

- `config/tackle.php` and `config/ai.php` are published
- An API key is configured for the active provider
- The project is a git repository with at least one commit
- `.env.testing` exists (warns if missing)
- If healing is enabled: migration has been run, GitHub token is available
- Integration status for [GitHub](/integrations/github) and
  [Sentry](/integrations/sentry)

## tackle:install

One-command installers for the optional pieces:

```bash
php artisan tackle:install remote   # composer-require Tackle Remote (--no-dev to add to require)
php artisan tackle:install review   # scaffold .github/workflows/tackle-review.yml
php artisan tackle:install guard    # print the guard-pack hook entries to add to config
```

## tackle:prune

If a session is interrupted before cleanup (e.g. a crash or `kill -9`),
worktrees may be left behind in `/tmp`. Use `tackle:prune` to remove them:

```bash
php artisan tackle:prune

# Preview without removing
php artisan tackle:prune --dry-run
```

Only directories matching the `tackle-worktree-*` pattern are touched — the
command will never remove your main working tree.

## tackle:replay

Re-dispatches a previous [healing attempt](/agents/self-healing) — useful when
you want to retry after adjusting config or fixing something manually.

```bash
# Replay the most recent healing attempt
php artisan tackle:replay

# Replay the last attempt for a specific job class
php artisan tackle:replay --class="App\Jobs\ProcessPayment"

# Replay a specific log entry by ID
php artisan tackle:replay --id=42
```

## tackle:healing-log

Shows the [self-healing audit log](/agents/self-healing#audit-log):

```bash
php artisan tackle:healing-log
php artisan tackle:healing-log --type=job
php artisan tackle:healing-log --type=scheduled_task
php artisan tackle:healing-log --outcome=patched
php artisan tackle:healing-log --outcome=pr_opened
php artisan tackle:healing-log --limit=50
```

## tackle:mcp

Serves Tackle's tools over the Model Context Protocol — see
[MCP Server](/integrations/mcp).

## tackle:remote

Serves the mobile browser UI (requires the
[Tackle Remote](/integrations/remote) package).

## tackle:tool / tackle:agent

Generators for [custom tools and agents](/extending/custom-tools#generators-and-stubs):

```bash
php artisan tackle:tool MyTool
php artisan tackle:agent MyAgent
php artisan tackle:agent MyAgent --full
php artisan vendor:publish --tag="tackle-stubs"   # customise the stubs
```
