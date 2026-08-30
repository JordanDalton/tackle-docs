# Built-in Tools

These tools are available to the agent in every session.

## Filesystem

| Tool | What it does |
|---|---|
| `ReadFile` | Reads a text file, or a range of lines from it — pass `offset` and `limit` to read around a `SearchCode` hit instead of the whole file (a whole-file read is re-sent on every following step). Ranged reads come back line-numbered. Binary files are refused; very large reads are truncated. |
| `Glob` | Lists files matching a pattern. Protected paths are excluded from results. |
| `SearchCode` | Grep-style search returning file + line + snippet. Capped at 50 results. |
| `EditFile` | `str_replace` edit — `old_str` must appear exactly once or the edit is refused. |
| `WriteFile` | Creates a new file. Refuses if the path already exists. |

## Execution

| Tool | What it does |
|---|---|
| `RunArtisan` | Runs `php artisan <command>` in a subprocess. Allowlist-gated. `make:*` commands return the created file's contents, so the next edit needs no read. Failures report stdout as well as stderr — artisan prints most errors there. |
| `RunTests` | Runs Pest or `php artisan test` in a subprocess. Returns a structured summary — pass/fail counts and, per failure, the test name, `file:line`, and assertion — not the raw log. |
| `RunPint` | Runs Laravel Pint to format files. Called before finishing a task. |
| `RunLarastan` | Runs PHPStan / Larastan static analysis and returns the findings. Accepts an optional `path` and `level` override. No-ops gracefully if `vendor/bin/phpstan` is not present. |
| `RunShell` | General shell — governed by the `shell` config mode. |
| `RunComposer` | Composer with the dangerous parts fenced off — a fixed set of read-only and mutating subcommands, mutations always `--no-scripts`, scripts re-enabled only by a human at the terminal. Used by `ai:upgrade`. |
| `ReadPackageDocs` | Reads an installed package's upgrade guide, changelog, or `composer.json` from `vendor/` — a docs-only carve-out of the `vendor/*` protected path; package code stays unreadable. Used by `ai:upgrade`. |

## Observability

| Tool | What it does |
|---|---|
| `ReadLog` | Returns the last N lines of `storage/logs/laravel.log`. Accepts an optional filter string. |
| `QueryDatabase` | Runs a read-only `SELECT` query and returns results as JSON. Capped at 100 rows. |
| `MutateDatabase` | One `UPDATE`, `INSERT`, or `DELETE`, run inside a transaction that is only committed once a human has confirmed the exact affected-row count. **Off by default** — see [Database writes](/guide/safety#database-writes). |
| `ListRoutes` | Registered routes with method, URI, name, and action. One `filter` matches across all three; `method` narrows by verb. Boots a fresh process, so routes the agent wrote moments ago are seen. |
| `DescribeSchema` | Real DB schema from the live connection — tables, columns, types, indexes, foreign keys. Authoritative, not guessed from migrations. |
| `DescribeModels` | The [application map](/guide/app-map) for one model — real columns and types from the live connection, casts, fillable, relations (type, related model, foreign key), local and global scopes, accessors, observers, policy, and factory states. With no argument, lists every model. Schema only, never rows. |
| `DescribeRoute` | One route as the framework resolved it — the middleware stack with groups and aliases expanded, route-model bindings, the FormRequest and its validation rules, and the authorization guarding it. `ListRoutes` answers what exists; this answers what happens. |
| `AppInfo` | The application stack — Laravel/PHP versions, drivers (via `artisan about`), and notable installed packages (Livewire/Inertia/Filament, Pest/PHPUnit, Fortify, …). |
| `GitDiff` | Shows a git diff — supports staged, a specific commit, a branch range, or a path. |
| `ReadTelescopeEntry` | Reads Telescope exception entries. Pass a job UUID for a specific lookup, or omit to return recent exceptions. No-ops gracefully if Telescope is not installed. |
| `ReadSentryIssue` | Fetches a Sentry issue by ID — exception, stacktrace, breadcrumbs, and request context. Omit the ID to list recent unresolved issues for the configured project. No-ops gracefully if `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` are not set. |
| `ReadGitHubIssue` | Fetches a GitHub issue by number — title, body, labels, and all comments. Omit the number to list recent open issues. No-ops gracefully if `GITHUB_TOKEN` / `GITHUB_REPO` are not set. |
| `ReadPullRequest` | Fetches a GitHub pull request by number — title, body, **branch name (head ref)**, base branch, state, author, and comments. Use this (not `ReadGitHubIssue`) when the user references a PR number, especially when the branch name is needed for `CommitAndPush`. |
| `CreateGitHubIssue` | Opens a new GitHub issue with a title and body. |
| `CreatePullRequest` | Creates a branch, commits all worktree changes, pushes to origin, and opens a GitHub pull request. If the change added tests, they are first run twice — with the change (must pass) and with it reverted (must fail) — and the result is reported in the PR body; a test that passes either way is flagged as possibly not covering the change. `AI_CODE_VERIFY_RED_GREEN=false` disables. |
| `CommitAndPush` | Stages all changes, fetches the remote branch tip, rebases onto it, commits, and pushes via `HEAD:<branch>` — without checking out the branch. Use this to add follow-up commits to an existing PR from a worktree session. Always pass the `branch` parameter (get it from `ReadPullRequest`). |
| `AskUser` | Presents the user with a `select()` or `multiselect()` prompt and returns their choice. Interactive sessions only — not exposed to headless runs. |
| `ConfirmAction` | Presents the user with a `confirm()` prompt before a destructive or irreversible operation. Returns `"confirmed"` or `"cancelled"`. Interactive sessions only — not exposed to headless runs. |
| `Delegate` | Runs a self-contained task in a [subagent](/extending/subagents) — a separate agent with its own fresh context and narrower toolset — and returns only its final report. Present only when `tackle.subagents` is non-empty. |

All file reads happen in-process. Everything that executes code runs as a
subprocess, so a broken generated file cannot crash the agent session.

`DescribeSchema`, `DescribeModels`, and `DescribeRoute` are the tools an agent
running outside your application cannot have — see [The Application
Map](/guide/app-map) for what they return and why it beats reading the files.

Want to add your own? See [Custom Tools](/extending/custom-tools).
