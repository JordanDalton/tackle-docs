# Utility Commands

The agent commands (`ai:code`, `ai:run`, `ai:fix`, `ai:review`, `ai:respond`,
`ai:explain`, `ai:test`, `ai:onboard`, `ai:upgrade`, `ai:eval`) each have their own page under
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

## tackle:map

Shows the [application map](/guide/app-map) — what the agent sees when it looks
at your Eloquent layer. Reads the live connection and the booted application,
so it is authoritative where a model file and its migrations are not.

```bash
php artisan tackle:map                      # the index: every model and its table
php artisan tackle:map Post                 # one model, in full
php artisan tackle:map --all                # every model, in full
php artisan tackle:map --route=posts.update # one route: middleware, rules, authorization
php artisan tackle:map --plain              # exactly what the agent sees, uncoloured
php artisan tackle:map --fresh              # discard the cached map and rebuild
```

Useful for warming the cache in CI, and for seeing exactly what your agent sees
before you blame it for a wrong column name.

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
php artisan tackle:install eval-ci # scaffold nightly ai:eval workflow
php artisan tackle:install codex    # composer-require Tackle Codex (--no-dev to add to require)
php artisan tackle:install grok     # composer-require Tackle Grok (--no-dev to add to require)
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

## tackle:telegram

Runs a coding session driven from Telegram — outbound-only, so it works from
anywhere without your machine being reachable. Requires the
[Tackle Telegram](/integrations/telegram) package.

```bash
php artisan tackle:telegram                   # start a session
php artisan tackle:telegram --pair            # find the chat id and write it to .env
php artisan tackle:telegram --if-configured   # idle instead of failing, for a dev script
```

## tackle:slack

Runs a coding session driven from Slack — over Socket Mode, so it is
outbound-only and works from anywhere without your machine being reachable.
Requires the [Tackle Slack](/integrations/slack) package.

```bash
php artisan tackle:slack                      # start a session
php artisan tackle:slack --pair               # find your user and channel ids and write them to .env
php artisan tackle:slack --session=billing    # a separate conversation
php artisan tackle:slack --if-configured      # idle instead of failing, for a dev script
```

## tackle:eval

Scaffolds a new [`ai:eval`](/agents/eval) case into your project's `evals/`
directory (a `tackle:` generator, like `tackle:tool`/`tackle:agent` — it writes
a file, it does not run the agent):

```bash
php artisan tackle:eval "refund rounding"   # writes evals/refund-rounding.php
```

## tackle:tool / tackle:agent

Generators for [custom tools and agents](/extending/custom-tools#generators-and-stubs):

```bash
php artisan tackle:tool MyTool
php artisan tackle:agent MyAgent
php artisan tackle:agent MyAgent --full
php artisan vendor:publish --tag="tackle-stubs"   # customise the stubs
```
