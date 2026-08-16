# Safety

Tackle's safety layer is enforced in PHP — not by prompting the model nicely.

- **Protected paths** — Tackle's file tools cannot read or write `.env`,
  `storage/`, `vendor/`, or `.git/` by default. Enforced in `PathGuard`, not via
  prompting — no wording in a prompt makes `ReadFile` return your `.env`. (This
  guards the *tools*, not the whole process — see
  [What the guards do and don't stop](#what-the-guards-do-and-don-t-stop).)
- **Unstaged edits** — in standard mode all file changes are left unstaged.
  Review with `git diff`; discard with `git checkout -- .`.
- **Worktree isolation** — in worktree mode all edits go to a temp copy of the
  repo. Live files are untouched until you open a PR. The worktree is cleaned
  up automatically when the session ends.
- **Environment-aware defaults** — production defaults to `shell: off` and
  `worktree: on`. The artisan allowlist is narrowed per environment (e.g.
  `test` and `migrate:*` are only allowed locally). All of this is enforced in
  PHP, not via prompting.
- **Allowlist-gated commands** — `RunArtisan` and `RunTests` check the
  allowlist for the current environment before executing. Commands not in the
  list are refused with a clear message. Destructive commands (e.g.
  `migrate:fresh`) require an interactive confirmation even when allowlisted.
- **Budget cap** — the session aborts once estimated spend exceeds
  `budget_usd`.
- **Subprocess isolation** — `RunArtisan`, `RunTests`, `RunPint`, and
  `RunShell` all run as child processes. A broken generated file cannot crash
  the session.
- **Shell is gated** — the default `approve` mode requires your confirmation
  before any shell command runs. Use `--off` for read-only exploration.

## What the guards do and don't stop

Be clear-eyed about what these guarantees are worth, because it changes how you
should deploy Tackle.

**By default, the agent runs as you.** Every subprocess it starts — `RunTests`,
`RunArtisan`, `RunPint`, an allowlisted `composer` under `RunShell` — executes
with your operating-system user's full privileges. Those are separate processes
that Tackle's in-PHP guards do not sit inside.

The consequence: an agent that can **write code** and **trigger its execution**
can reach anything your user can, `PathGuard` notwithstanding. It never needs
to call `ReadFile` on `.env` — it can write a Pest test that reads
`env('APP_KEY')` and surfaces it, then call `RunTests`; the subprocess reads
the file your user can already read, and `PathGuard` is never in the path.
Composer scripts are arbitrary PHP and are the same story. **Worktree mode
does not change this** — the subprocess still runs as you and still reads the
real `.env`.

This is not a bug in the implementation. It is the fundamental limit of running
an agent at your own privilege level: **in-process guards cannot contain
in-process code execution.** So:

- **What the guards *do* stop:** honest mistakes, casual missteps, and the
  accidental blast radius of a confused agent — a stray `rm`, an edit to the
  wrong file, a `migrate:fresh` on the wrong database. This is the
  overwhelming majority of what actually goes wrong day to day, and it is real
  protection.
- **What they *do not* stop:** a determined agent — or, more realistically, a
  **prompt-injected** one. `ai:fix --sentry=`, `ai:respond`, and issue-driven
  runs all ingest text an attacker can influence (a crafted exception message,
  a PR comment, an issue body). Treat that text as untrusted input that
  reaches an agent running as you.

**How to actually bound it**, in ascending order of real containment:

1. **Keep the production defaults.** In `production`, shell is `off`, worktree
   is `on`, and the artisan allowlist narrows to `route:list` — the
   code-execution paths above are closed there. The exposure is real mainly on
   a developer's own machine and in staging.
2. **Run untrusted-input jobs (`ai:fix`, `ai:respond`, self-healing) in CI or a
   container with scoped, throwaway credentials** — never with your production
   secrets in the environment. If the agent exfiltrates the env, there is
   nothing there worth taking.
3. **Isolate the process.** True containment comes from an OS-level jail (a
   locked-down container, a disposable VM, throwaway credentials), not from
   in-language checks. If you need a *structural* guarantee rather than a
   best-effort one, that is the layer that provides it.

The short version: Tackle's guards make the agent safe to *work with*. They do
not make an agent running on your machine safe to *distrust*. Deploy the
untrusted-input paths accordingly.

## Guard pack

Tackle ships optional first-party hooks that block the concrete paths above.
Install the recommended registration with:

```bash
php artisan tackle:install guard
```

It prints three `pre_tool` hook entries to add under `hooks.pre_tool` in
`config/tackle.php`:

- **`SecretExfiltrationGuard`** (WriteFile, EditFile) — refuses writing code
  that reads secrets to surface them: `env('…_KEY')`, `config('app.key')`,
  reading `.env` directly. This closes the write-a-test-that-dumps-env path.
- **`NetworkExfiltrationGuard`** (WriteFile, EditFile, RunShell) — flags the
  exfiltration transport: outbound HTTP in agent-authored code,
  `curl … | sh`, external `curl`/`wget`. Mode `block` (default), `confirm`,
  or `off`.
- **`ComposerScriptGuard`** (RunShell) — blocks `composer run-script`/`exec`
  and lifecycle-script invocations, since composer scripts are arbitrary PHP.

Tune each via `tackle.guard` (`AI_CODE_GUARD_SECRETS`, `…_NETWORK`,
`…_COMPOSER`); extend the secret patterns with `tackle.guard.secret_patterns`.

::: warning Defense-in-depth — one more layer, not the wall
The guard pack raises the cost of the known exfiltration paths and catches
mistakes and unsophisticated injection, but it runs in-process at the agent's
privilege and a determined attacker who avoids the signatures is not stopped by
it. It sits *below* mitigation #3 (OS-level isolation), never in place of it.
:::

## Injection shield (experimental)

The guards above defend the *outbound* paths — code the agent writes. The
*inbound* threat is prompt injection through the untrusted text the agent
reads: a crafted exception message, an issue body, a PR comment carrying
instructions aimed at the agent. The injection shield screens the untrusted
readers (`ReadSentryIssue`, `ReadGitHubIssue`, `ReadPullRequest`) with a cheap
classifier model. Flagged content is returned **fenced and labelled as
untrusted data the agent must not obey** — reframed, not blocked, so the
reader still works. Enable it in `config/tackle.php`:

```php
'guard' => [
    'injection_classifier' => [
        'enabled' => env('AI_CODE_GUARD_INJECTION', true),
        'model'   => 'claude-haiku-4-5-20251001',   // a small, fast model
    ],
],
```

It costs one cheap model call per untrusted read and **fails open** — a
classifier error passes the content through unshielded rather than breaking
the read. Same honest caveat, doubly so here: the classifier is itself an LLM
and can be injected. It lowers the odds a crafted payload steers the main
agent; it does not eliminate them. Defense-in-depth, still below OS isolation.
