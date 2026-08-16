# Limitations & Known Risks

## Limitations

Things Tackle cannot do in v1:

- **No internet access.** The agent cannot fetch URLs, read documentation, or
  call external APIs. It works only with files in your workspace.
- **No binary files.** `ReadFile` reads text. Images, compiled assets, and
  other binaries are not readable by the agent.
- **No auto-commit or push in standard mode.** In a normal session all edits
  are left unstaged. In worktree mode the agent can commit and push to an
  existing PR branch using the `CommitAndPush` tool, but it will always call
  `ConfirmAction` first.
- **History persists as text.** With the default `memory=file`, sessions
  resume across runs, but tool outputs and image attachments are not
  replayed — the agent re-reads what it needs. Set `memory=none` to start
  fresh every time.
- **Budget is estimated, not exact.** The spend limit is calculated from
  token counts using approximate per-model pricing. Actual charges from your
  provider may differ slightly.
- **Tests need a working environment.** `RunTests` runs your actual test
  suite. If tests require a database or other services, those must be running
  and configured before starting a session.

## Known Risks

::: warning `laravel/ai` is new and fast-moving
It reshapes its `Agent` contract on most 0.x minors, and an incompatible
method signature is a *compile-time* fatal — the agent class cannot be
declared at all, taking down every command with it. Tackle supports
`>=0.1 <0.11` and CI runs the suite against the oldest, middle, and newest of
that range on PHP 8.3 and 8.4. A release beyond 0.10 is not covered until the
matrix is extended.
:::

::: warning This tool modifies your codebase and runs commands
Always run it inside a committed git working tree so you have a clear undo
path (`git checkout -- .`).
:::

For the full, honest account of the security model — including what the
guards can and cannot contain — read [Safety](/guide/safety).
