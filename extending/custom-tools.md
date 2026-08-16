# Custom Tools

Create a class that extends `Tackle\Tools\AbstractTool`, then extend
`DefaultCodingAgent` to merge it into the tool list, and rebind the contract.

## Step 1 — Generate the tool (or write it manually)

```bash
php artisan tackle:tool ReadDatabase
```

## Step 2 — Implement the tool

```php
// app/Ai/Tools/ReadDatabase.php
namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Ai\Tools\Request;
use Tackle\Tools\AbstractTool;

class ReadDatabase extends AbstractTool
{
    public function description(): string
    {
        return 'Run a read-only SQL query and return results as JSON. SELECT only.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('The SELECT query to run.')
                ->required(),
        ];
    }

    public function handle(Request $request): string
    {
        $sql = $request->string('query', '');

        if (! str_starts_with(strtolower(ltrim($sql)), 'select')) {
            return 'Only SELECT queries are allowed.';
        }

        return json_encode(DB::select($sql), JSON_PRETTY_PRINT);
    }
}
```

## Step 3 — Extend the agent (or generate it)

```bash
php artisan tackle:agent MyCodingAgent
```

## Step 4 — Wire in your tool

```php
// app/Ai/MyCodingAgent.php
namespace App\Ai;

use App\Ai\Tools\ReadDatabase;
use Tackle\Agents\DefaultCodingAgent;

class MyCodingAgent extends DefaultCodingAgent
{
    public function __construct(
        private ReadDatabase $readDatabase,
        ...$args,
    ) {
        parent::__construct(...$args);
    }

    public function tools(): iterable
    {
        return [...parent::tools(), $this->readDatabase];
    }
}
```

## Step 5 — Rebind in your service provider

```php
// app/Providers/AppServiceProvider.php
use App\Ai\MyCodingAgent;
use Tackle\Contracts\CodingAgent;

public function register(): void
{
    $this->app->bind(CodingAgent::class, MyCodingAgent::class);
}
```

The Laravel container resolves all constructor dependencies automatically, so
your tool class can type-hint anything it needs (DB connections, services,
etc.).

## Tool contract

Every tool receives a `Laravel\Ai\Tools\Request` object in `handle()`. It
behaves like a read-only request bag:

```php
$request->string('key', 'default');   // string value
$request->boolean('key', false);      // boolean value
$request->integer('key', 0);          // integer value
$request->get('key', 'default');      // raw value
$request->all();                      // all arguments as array
```

When a tool should refuse an action, **return a string explaining why** rather
than throwing an exception. The agent reads the refusal message and reroutes
itself accordingly.

## Generators and stubs

Tackle ships generator commands so you don't have to look up method
signatures:

```bash
# Scaffold a tool at app/Ai/Tools/MyTool.php
php artisan tackle:tool MyTool

# Scaffold an agent that extends DefaultCodingAgent (most common)
php artisan tackle:agent MyAgent

# Scaffold a bare CodingAgent implementation
php artisan tackle:agent MyAgent --full
```

To customise the generated stubs, publish them first:

```bash
php artisan vendor:publish --tag="tackle-stubs"
```

This copies the stubs to `stubs/tackle/` in your project root. Both commands
check for published stubs before falling back to the package defaults.
