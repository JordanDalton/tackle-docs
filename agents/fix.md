# Fix an Issue (ai:fix)

`php artisan ai:fix` opens a focused fix session. It loads context from a
Sentry issue, a GitHub issue, or a pasted exception — then fires the agent
immediately, without you having to describe the task. Worktree mode is on by
default so live files are never touched until you open a PR.

```bash
# Paste or describe the exception at the prompt
php artisan ai:fix

# Load context from a Sentry issue
php artisan ai:fix --sentry=4821

# Load context from a GitHub issue
php artisan ai:fix --issue=42
```

After the agent applies the fix, the session stays open for follow-up:

```
> add a regression test for this
> open a pull request
> exit
```

All shell and worktree flags from [`ai:code`](/agents/interactive) are
supported:

```bash
php artisan ai:fix --sentry=4821 --no-worktree   # edit live files directly
php artisan ai:fix --issue=42 --yolo              # skip shell approval prompts
```

## Setup for issue sources

- `--sentry=ID` requires the [Sentry integration](/integrations/sentry)
  (`SENTRY_AUTH_TOKEN` + `SENTRY_ORG`).
- `--issue=N` requires the [GitHub Issues integration](/integrations/github)
  (`GITHUB_TOKEN` + `GITHUB_REPO`).

::: warning Untrusted input
Exception messages, issue bodies, and comments are text an attacker can
influence, and they reach an agent running as you. Read
[What the guards do and don't stop](/guide/safety#what-the-guards-do-and-don-t-stop)
before wiring `ai:fix` to untrusted sources, and consider running it in CI
with throwaway credentials.
:::
