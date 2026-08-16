# Custom Agents

## Swapping the agent entirely

If you need deeper control — different instructions, a different conversation
strategy, or a completely different set of tools — implement the `CodingAgent`
contract directly and rebind it:

```php
// app/Ai/MyAgent.php
namespace App\Ai;

use Laravel\Ai\Promptable;
use Tackle\Contracts\CodingAgent;

class MyAgent implements CodingAgent
{
    use Promptable;

    public function instructions(): string
    {
        return 'You are a specialist in this project. Only touch the billing module.';
    }

    public function messages(): iterable
    {
        return [];
    }

    public function tools(): iterable
    {
        return [
            // your tools here
        ];
    }
}
```

```php
$this->app->bind(\Tackle\Contracts\CodingAgent::class, MyAgent::class);
```

The `CodingAgent` contract extends `Laravel\Ai\Contracts\Agent`, `HasTools`,
and `Conversational`, so `laravel/ai`'s full streaming and tool-calling
machinery works automatically as long as you use the `Promptable` trait.

For the more common case — keeping the default agent and adding tools to it —
see [Custom Tools](/extending/custom-tools). Custom agents can also be
registered as [subagents](/extending/subagents#adding-your-own) the main agent
delegates to.

## MCP client tools

Just as external clients can consume Tackle's tools
[over MCP](/integrations/mcp), Tackle's agents can consume **external MCP
servers**. Install [`laravel/mcp`](https://github.com/laravel/mcp) (requires
`laravel/ai` >= 0.8), then return the client's tools from an agent's
`tools()` — `laravel/ai` wraps them automatically, prefixed `mcp_tools_*`:

```php
use Laravel\Mcp\Facades\Mcp;

class MyCodingAgent extends DefaultCodingAgent
{
    public function tools(): iterable
    {
        return [
            ...parent::tools(),
            ...Mcp::client('playwright')->tools(),
        ];
    }
}
```

Now the agent can drive a browser to verify its own fix, query an external
system, or use any other MCP server you trust — while Tackle's own tools keep
their PathGuard and shell-policy enforcement.
