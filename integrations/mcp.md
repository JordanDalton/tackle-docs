# MCP Server

Tackle's tools aren't only for Tackle's agents. `tackle:mcp` serves them over
the [Model Context Protocol](https://modelcontextprotocol.io) (stdio), so any
MCP client — Claude Code, Cursor, Zed — can use Laravel-aware tools like
`ListRoutes`, `QueryDatabase`, `ReadTelescopeEntry`, and `RunLarastan` against
your app, with Tackle's safety layer still enforced in PHP: protected paths,
the artisan allowlist, and SELECT-only database queries all apply exactly as
they do for Tackle's own agents.

## Setup

Register it with Claude Code from your app directory:

```bash
claude mcp add tackle -- php artisan tackle:mcp
```

Or add it to `.mcp.json` manually:

```json
{
  "mcpServers": {
    "tackle": {
      "command": "php",
      "args": ["artisan", "tackle:mcp"]
    }
  }
}
```

## Choosing the exposed tools

The exposed tool set is controlled by `config('tackle.mcp.tools')` and
defaults to read/inspect and analysis tools only — no file writes, no shell.
Add write tools (`EditFile`, `WriteFile`, `RunPint`, …) to the list if you
trust the connected client. Interactive tools (`AskUser`, `ConfirmAction`)
are refused outright: an MCP client has no terminal to answer their prompts.
Avoid tools that ask for terminal confirmation, such as `CommitAndPush` —
they would hang the stdio session.

::: info Hooks don't apply here
[Hooks](/extending/hooks) apply everywhere tools run through the agent
harness — they do not apply to tools served over `tackle:mcp`. The connected
MCP client is the policy layer there.
:::

## The other direction: consuming MCP servers

Tackle's agents can also consume **external** MCP servers — a browser, an
external system, anything you trust. See
[MCP client tools](/extending/custom-agents#mcp-client-tools).
