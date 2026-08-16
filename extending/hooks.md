# Hooks

Hooks are deterministic commands that run around agent activity — enforced in
PHP and shell, not by the model. Use them to audit every tool call, block
specific commands with your own policy, rewrite tool arguments before they
run, or trigger follow-up work (formatting, notifications) after edits.

Declare them in `config/tackle.php`:

```php
'hooks' => [
    'pre_tool' => [
        // Shell hook: guard every RunShell call with your own script.
        ['match' => 'RunShell', 'run' => 'scripts/tackle/guard-shell.sh'],

        // Class hook: audit every tool call.
        ['match' => '*', 'using' => \App\Hooks\AuditToolCalls::class],
    ],
    'post_tool' => [
        // Format after every file edit.
        ['match' => ['EditFile', 'WriteFile'], 'run' => 'vendor/bin/pint --dirty'],
    ],
    'session_start' => [],
    'session_end' => [],
],
```

## Events

Four events fire:

| Event | When | Can block? | Can rewrite arguments? |
|---|---|---|---|
| `pre_tool` | Before a tool executes | Yes | Yes |
| `post_tool` | After a tool executes | No | No |
| `session_start` | An agent session begins | No | No |
| `session_end` | An agent session ends | No | No |

Each hook takes either `run` (a shell command) or `using` (a class name), plus
optional `match` (a tool-name glob or array of globs — `'Run*'`,
`['EditFile', 'WriteFile']`; default `'*'`) and `timeout` (seconds, default
10). Hooks run in declaration order; the first block wins, and argument
rewrites chain into the next hook.

## Shell hooks

**Shell hooks** speak a stable JSON protocol, so they can be written in any
language:

- The event payload arrives on **stdin**:
  `{"event":"pre_tool","tool":"RunShell","arguments":{"command":"ls"}}`
  (`post_tool` adds `result` and `duration_ms`).
- **Exit 0** allows the call. For `pre_tool`, stdout may contain
  `{"arguments": {...}}` to rewrite the tool's arguments.
- **Exit 2** blocks the call — stderr becomes the refusal message the agent
  sees, so make it instructive: `echo "Use RunTests instead" 1>&2; exit 2`.
- Any other exit code, a timeout, or a crash is logged and ignored — a broken
  hook never bricks a session.

## Class hooks

**Class hooks** implement `Tackle\Contracts\ToolHook` (or are plain
invokables). Return `null` to allow, `false` to block, a string to block with
that message, or an array (`pre_tool` only) to replace the arguments:

```php
namespace App\Hooks;

use Tackle\Contracts\ToolHook;

class AuditToolCalls implements ToolHook
{
    public function handle(array $payload): null|false|string|array
    {
        logger()->info("Tackle called {$payload['tool']}", $payload['arguments']);

        return null; // observe only
    }
}
```

## Notes

- Hooks apply everywhere tools run through the agent harness — `ai:code`,
  `ai:run`, `ai:fix`, and the self-healer. They do not apply to tools served
  over [`tackle:mcp`](/integrations/mcp) (the connected MCP client is the
  policy layer there).
- Hooks complement the existing [Laravel events](/extending/events):
  `ToolCalling` listeners can also veto calls in pure PHP. Reach for hooks
  when you want config-declared, ordered policy or non-PHP tooling; reach for
  listeners when you're already living in the event system.
- Hooks are policy on top of the [safety layer](/guide/safety), not a
  replacement for it — `PathGuard`, the artisan allowlist, and shell modes
  still apply first.

## First-party hooks

Tackle ships a [guard pack](/guide/safety#guard-pack) of first-party
`pre_tool` hooks — `SecretExfiltrationGuard`, `NetworkExfiltrationGuard`, and
`ComposerScriptGuard` — that close known exfiltration paths.
