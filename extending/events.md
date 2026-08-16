# Events

Tackle dispatches Laravel events around the agent lifecycle, so ordinary
listeners can observe — or veto — what agents do. (For config-declared,
ordered policy — including shell-command hooks and argument rewriting — see
[Hooks](/extending/hooks).)

| Event | When | Payload |
|---|---|---|
| `Tackle\Events\SessionStarted` | An `ai:code` / `ai:run` session begins | command, provider, model |
| `Tackle\Events\SessionEnded` | The session ends | command, token counts, estimated cost |
| `Tackle\Events\ToolCalling` | Before a tool executes — **vetoable** | tool name, arguments |
| `Tackle\Events\ToolCalled` | After a tool executes | tool name, arguments, result, duration |

A `ToolCalling` listener that returns `false` blocks the call (the agent
receives a refusal and reroutes); returning a string uses it as the refusal
message. Anything else observes without interfering:

```php
use Tackle\Events\ToolCalling;
use Tackle\Events\ToolCalled;

Event::listen(ToolCalling::class, function (ToolCalling $event) {
    if ($event->tool === 'RunShell' && now()->isWeekend()) {
        return 'No shell commands on weekends.';
    }
});

Event::listen(ToolCalled::class, function (ToolCalled $event) {
    AgentAudit::record($event->tool, $event->arguments, $event->durationMs);
});
```

Events fire for the tools of `DefaultCodingAgent` (and subclasses) and the
self-healer. This is an extension layer on top of the
[safety guards](/guide/safety), not a replacement — `PathGuard`, shell modes,
and allowlists still apply first. Requires a `laravel/ai` version with
`ToolNameResolver` (0.10+); on older versions the events simply don't fire.
