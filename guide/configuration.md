# Configuration

After publishing the config, edit `config/tackle.php`. All values can be set
via environment variables — see the
[Environment variables](/reference/environment) reference.

```php
return [
    // laravel/ai provider name — must match a key in config/ai.php
    'provider' => env('AI_CODE_PROVIDER', 'anthropic'),

    // Model to use
    'model' => env('AI_CODE_MODEL', 'claude-sonnet-4-6'),

    // Tool-call ceiling for ai:run — a cap, not a grant; it cannot raise
    // the agent's own #[MaxSteps] attribute
    'max_steps' => env('AI_CODE_MAX_STEPS', 40),

    // Hard spend limit for the session in USD — aborts when exceeded
    'budget_usd' => env('AI_CODE_BUDGET', 1.00),

    // Shell execution policy — string or per-environment array.
    // String form (backward-compatible): applies to all environments.
    // Array form: keyed by environment name; production defaults to 'off'.
    'shell' => [
        'local'      => env('AI_CODE_SHELL', 'approve'),
        'staging'    => env('AI_CODE_SHELL', 'approve'),
        'production' => env('AI_CODE_SHELL', 'off'),
    ],

    'shell_allowlist' => ['composer', 'npm', 'php artisan'],

    // Artisan commands the agent may run without confirmation — per environment.
    // Flat array form is still accepted for backward compatibility.
    'artisan_allowlist' => [
        'local'      => ['make:*', 'migrate:*', 'db:seed', 'route:list', 'test'],
        'staging'    => ['migrate', 'route:list'],
        'production' => ['route:list'],
    ],

    // Artisan commands that require an interactive confirmation before running.
    'artisan_destructive' => [
        'local'      => ['migrate:fresh', 'migrate:reset', 'migrate:refresh', 'db:wipe'],
        'staging'    => [],
        'production' => [],
    ],

    // Worktree isolation — edits go to a temp worktree instead of live files.
    // Production defaults to true; other environments default to false.
    'worktree' => [
        'local'      => env('AI_CODE_WORKTREE', false),
        'staging'    => env('AI_CODE_WORKTREE', false),
        'production' => env('AI_CODE_WORKTREE', true),
    ],

    // Glob patterns (relative to workspace) the agent can never read or write
    'protected_paths' => ['.env', '.env.*', 'storage/*', 'vendor/*', '.git/*'],
    'ignored_directories' => ['node_modules', '.git', 'vendor', 'storage', 'bootstrap/cache', 'public/build'],
    'max_tool_result_chars' => env('AI_CODE_MAX_TOOL_RESULT_CHARS', 48000),
    'max_context_chars' => env('AI_CODE_MAX_CONTEXT_CHARS', 600000),

    // Root directory for the agent — null defaults to base_path()
    'workspace' => null,

    // Session memory: file (default, resumes across runs) | none
    'memory' => env('AI_CODE_MEMORY', 'file'),
];
```

## Shell modes

| Mode | Behaviour |
|---|---|
| `off` | `RunShell` refuses everything. Use `RunArtisan` / `RunTests` instead. |
| `allowlist` | Only commands whose first token matches `shell_allowlist` run unattended. |
| `approve` | **Default.** Every command shows a confirmation prompt before running. Choosing **"always allow this exact command"** saves it to `.tackle/permissions.json`, and it runs without asking from then on. |
| `yolo` | Runs anything, no prompt. **Dangerous — CI or fully-trusted environments only.** |

Shell mode can be set as a plain string (applies to all environments) or as a
per-environment array (shown above). The `production` key defaults to `off`.

You can override the mode for a single session with `--shell` — see
[Interactive Coding](/agents/interactive#shell-mode-flag).

## Artisan allowlist and destructive list

`artisan_allowlist` controls which commands the agent may run freely.
`artisan_destructive` lists commands that require an interactive terminal
confirmation before running. Commands in neither list are refused outright.
Both support glob patterns (`make:*` covers `make:model`, `make:controller`,
etc.) and can be a flat array (all environments) or a per-environment keyed
array.

`RunTests` also respects the allowlist — if `test` is not in the allowlist for
the current environment, the tool is refused.

## Protected paths

The `protected_paths` globs prevent the agent from reading or writing sensitive
files regardless of what it is asked to do. This is enforced in PHP, not via
prompting. Add your own patterns here if your project has additional secrets.

For an honest account of what path protection does and doesn't guarantee, read
[What the guards do and don't stop](/guide/safety#what-the-guards-do-and-don-t-stop).

## Context guards

A tool result is re-sent on every later step of a turn, so one oversized
result — a recursive listing that walks `node_modules`, a search whose snippet
is a minified line, a binary read — is paid for again and again until the turn
ends, far past what the budget check (which runs when a stream finishes) can
catch. Three settings bound it, all enforced in PHP:

```php
// Skipped by Glob and SearchCode on recursive walks (a relevance filter,
// not a security boundary — the agent can still target a file inside them)
'ignored_directories' => ['node_modules', '.git', 'vendor', 'storage', 'bootstrap/cache', 'public/build'],

// Hard cap on any single tool result, for every tool that runs through the harness
'max_tool_result_chars' => env('AI_CODE_MAX_TOOL_RESULT_CHARS', 48000),

// Tool output one turn may accumulate before further tool calls are refused
// and the agent is told to finish with what it has (resets per turn;
// subagents get their own counter)
'max_context_chars' => env('AI_CODE_MAX_CONTEXT_CHARS', 600000),
```

`ReadFile` additionally refuses binary files and truncates very large ones.

## Prompt caching

On Anthropic, every agent marks the system prompt + tool schemas with a
`cache_control` breakpoint, so the fixed per-step prefix — which is otherwise
re-sent at full price on every step — is billed at ~10% on repeat steps. It is
**on by default** and transparent (identical behaviour, lower cost); measured
~75% lower fresh input on a fix case.

```php
// config/tackle.php
'prompt_cache' => env('AI_CODE_PROMPT_CACHE', true),
```

Set `AI_CODE_PROMPT_CACHE=false` to disable it everywhere, or measure its effect
on a benchmark with `ai:eval --no-cache`. It is a no-op for non-Anthropic
providers.

Budget tracking is cache-aware: cache reads are billed at ~10% and the first
write at 1.25× of the input rate, so budgets and `ai:eval` costs stay accurate
with caching on.

## Tool scoping

The coding agent's tools are part of the system prompt, re-sent on every step,
so a smaller toolset is cheaper. Two things keep it lean:

- **Integration tools are lazy.** GitHub tools appear only when `tackle.github.token`
  is set, Sentry's only with `tackle.sentry.auth_token`, Telescope's only when
  Telescope is installed. The agent couldn't use them unconfigured anyway, so
  this trims the per-step floor with zero capability loss.
- **An explicit allowlist.** Set `tackle.tools` to a list of tool class base
  names to restrict the agent further:

```php
// config/tackle.php — only these tools, nothing else
'tools' => ['ReadFile', 'EditFile', 'WriteFile', 'Glob', 'SearchCode', 'RunTests'],
```

Measure the cost/fix-rate trade-off of any toolset with
[`ai:eval --agent`](/agents/eval). Null (the default) = all tools.

## Rendered tables

A markdown table in the agent's answer is drawn as a table in the terminal
rather than printed as pipes. Only the table's own lines are held back, so the
rest of the response still streams as it arrives, and the transcript keeps the
original markdown either way.

```php
// config/tackle.php
'render_tables' => env('AI_CODE_RENDER_TABLES', true),
```

Toggle it for a single session with [`/raw`](/agents/interactive#rendered-tables).

## The application map

The agent runs inside your booted application, so it can read the real schema,
the real relationships, and the real middleware stack rather than inferring
them from files. A one-line-per-model index goes into every session's system
prompt; the detail comes on demand through `DescribeModels` and `DescribeRoute`.

```php
// config/tackle.php
'app_map' => [
    'enabled' => env('AI_CODE_APP_MAP', true),
    'index' => env('AI_CODE_APP_MAP_INDEX', true),
    'cache' => env('AI_CODE_APP_MAP_CACHE', true),
    'probe_untyped_relations' => env('AI_CODE_APP_MAP_PROBE_RELATIONS', false),
],
```

It is on by default and read-only — schema and metadata, never rows — so it is
safe to leave enabled in every environment. See [The Application
Map](/guide/app-map) for what it returns, how it is cached, and what it
deliberately refuses to do.

## Worktree isolation

Worktree mode runs the agent against an isolated git worktree rather than your
live files. All edits land in a temp directory; nothing touches your working
tree until you open a PR. Production environments default to `worktree: on`.

See [Worktree mode](/agents/interactive#worktree-mode) for session flags and
behaviour, and [`tackle:prune`](/reference/commands#tackle-prune) for cleaning
up worktrees left behind by interrupted sessions.
