# What is Tackle?

**Laravel Tackle is an AI agent harness for Laravel.**

Tackle is the runtime layer that lets AI agents operate inside your Laravel
application — reading code, executing tools, running tests, and taking action,
with safety boundaries enforced at the framework level.

Think of it the way you think of Claude Code, Codex, or GitHub Copilot — but
purpose-built for Laravel and installed directly into your app via Composer.
The harness ships with a family of built-in agents and a full tool
infrastructure you can extend or build on top of:

| Command | What it does |
|---|---|
| [`ai:code`](/agents/interactive) | An interactive coding agent that reads your codebase, edits files, runs tests, and formats code. Supports plan mode (approve a read-only plan before any edits), project-defined slash commands, and automatic context compaction for long sessions. |
| [`ai:run`](/agents/headless) | The same agent with no terminal attached: one task, a JSON result, and an exit code — for CI and cron. |
| [`ai:fix`](/agents/fix) | A focused fix session: paste an exception, point it at a Sentry issue (`--sentry=ID`) or GitHub issue (`--issue=N`), and the agent diagnoses, patches, and verifies the fix. Runs in worktree mode by default. |
| [`ai:review`](/agents/review) | A read-only agent that reviews git diffs and surfaces real issues with severity levels. Point it at a GitHub pull request (`--pr=42 --comment`) and it posts the findings as inline PR review comments. |
| [`ai:respond`](/agents/review#acting-on-review-comments-tackle) | Acts on a `/tackle` comment left on a pull request: applies the requested change, pushes it to the PR branch, and replies in the thread. |
| [`ai:explain`](/agents/explain-and-test) | Explains what a file, class, or method does in plain English. |
| [`ai:test`](/agents/explain-and-test#generate-tests) | Generates a Pest test file for any class or method. |
| [`ai:upgrade`](/agents/upgrade) | Safe major version upgrades for Composer dependencies — audit, plan, resolve, fix, verify — in an isolated worktree, delivered as a PR. |
| [Self-healer](/agents/self-healing) | An autonomous agent that listens for failed jobs and scheduled tasks, diagnoses the exception, patches the code, and opens a PR or applies the fix. |

Every agent runs through the same tool infrastructure and safety layer. You can
add your own tools, write new agents, and swap the default agent entirely — all
without forking the package. And the terminal isn't the only way to drive it:
[Tackle Remote](/integrations/remote) puts the same harness in your phone's
browser, approval prompts and all.

Built on top of [`laravel/ai`](https://github.com/laravel/ai) — and
**provider-agnostic** like it: Tackle runs on any provider `laravel/ai`
supports with tool calling. Anthropic (Claude) is the default; OpenAI, Gemini,
Groq, and fully local models via Ollama are two env vars away. See
[Models & Providers](/extending/models).

## How the harness works

Tackle has three layers:

| Layer | What it is |
|---|---|
| **Tools** | Action primitives agents can call — `ReadFile`, `EditFile`, `RunTests`, `RunShell`, etc. Every tool goes through `PathGuard` and shell policy before executing. |
| **Agents** | Classes implementing `CodingAgent` that receive a prompt, call tools, and return a result. Tackle ships several; you can add your own. |
| **Safety** | `PathGuard` blocks reads/writes outside the workspace and protected paths. `BudgetTracker` aborts the session when estimated spend exceeds the limit. Shell modes gate command execution. All enforced in PHP — not advisory. |

The self-healer adds a fourth piece: an event-driven runtime that spins up an
agent autonomously in an isolated git worktree whenever a job or scheduled task
fails. It is the same harness, running unattended.

## The ecosystem

The core package is the harness. Around it:

- **[Tackle Remote](/integrations/remote)** — a mobile-first browser UI for the
  same harness. Scan a QR code and your phone drives the agent.
- **[Tackle Review](/integrations/review-action)** — a GitHub Action that wraps
  `ai:review`, `ai:respond`, and `ai:upgrade` so every pull request gets
  reviewed with one workflow file.
- **[Tackle Codex](/integrations/codex)** — an OpenAI Codex provider: run the
  agents on your ChatGPT subscription (usage records as $0) or an OpenAI API
  key.
- **[Tackle Grok](/integrations/grok)** — an xAI Grok provider: run the agents
  on an xAI API key or your grok.com plan.
- **[MCP server](/integrations/mcp)** — `tackle:mcp` serves Tackle's
  Laravel-aware tools to any MCP client (Claude Code, Cursor, Zed), with the
  same safety layer enforced.

## Next steps

- [Install Tackle](/guide/installation) and run your first session.
- Read the [Safety model](/guide/safety) — what the guards do and, just as
  importantly, what they don't.
- Set up [project instructions](/guide/project-instructions) so every agent
  follows your conventions.
