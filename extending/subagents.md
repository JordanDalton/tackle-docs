# Subagents

The main coding agent can delegate self-contained work to **subagents** —
separate agents that run the task in their own fresh context with their own
(usually narrower) toolset, and hand back only their final report. Exploration
happens in the child; conclusions come back. Long sessions stay coherent
because reading twenty files to answer "how does billing work?" no longer
costs the main conversation twenty files of context.

Two subagents ship enabled:

| Name | What it does |
|---|---|
| `explorer` | Read-only codebase exploration — locates files, traces how a feature works across classes, reports back with precise file references. |
| `test-writer` | Writes a Pest test file for a class or behaviour and runs it. |

The agent decides when to delegate (its instructions steer it toward broad
research and away from small lookups), calling the `Delegate` tool with a
subagent name and a complete brief. You'll see the call in the session like
any other tool call.

## Guarantees

- **Shared budget.** Subagent token usage records into the same
  `BudgetTracker` as the parent session — delegation cannot exceed your
  spend limit, and a subagent is stopped mid-task if it exhausts it.
- **Same safety layer.** Subagent tools go through `PathGuard`, allowlists,
  [hooks](/extending/hooks), and `ToolCalling`/`ToolCalled`
  [events](/extending/events) — exactly like the parent's.
- **One level deep.** A subagent cannot delegate further.
- **No user prompts.** Subagents never ask questions; they make judgment
  calls and note them in the report.
- **Fail-soft.** A subagent that crashes returns an error message to the
  parent agent, which continues the session.

## Adding your own

Register any `Tackle\Contracts\CodingAgent` implementation in
`config/tackle.php` — including agents you've written (see
[Custom Agents](/extending/custom-agents)):

```php
'subagents' => [
    'explorer' => [
        'agent' => \Tackle\Agents\ExplorerAgent::class,
        'description' => 'Read-only codebase exploration...',
    ],
    'schema-expert' => [
        'agent' => \App\Ai\SchemaExpertAgent::class,
        'description' => 'Answers questions about the database schema, migrations, and model relationships.',
    ],
],
```

The `description` is what the delegating model reads when deciding where to
send work — write it like a tool description. Set `subagents` to an empty
array to remove the `Delegate` tool entirely.
