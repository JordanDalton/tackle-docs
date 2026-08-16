# Installation

## Requirements

- PHP ^8.3
- Laravel ^12.0
- [`laravel/ai`](https://github.com/laravel/ai) `>=0.1 <0.11` (see
  [Known Risks](/reference/limitations#known-risks))
  - `laravel/ai` 0.1.x itself requires PHP ^8.4; on PHP 8.3 Composer will resolve 0.2 or newer

## Before you start

Run through this checklist once before your first session:

- [ ] Commit or stash any in-progress work — the agent will modify files, and a
      clean git state is your undo button.
- [ ] Set `ANTHROPIC_API_KEY` in `.env` (or the key for your chosen provider).
- [ ] Publish the `laravel/ai` config: `php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"`
- [ ] Publish the Tackle config: `php artisan vendor:publish --tag="tackle-config"` (publishes as `config/tackle.php`)
- [ ] Run `php artisan ai:code` and type a small test task to confirm everything connects.

## Install the package

```bash
composer require jordandalton/laravel-tackle
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
php artisan vendor:publish --tag="tackle-config"
```

The service provider and `ai:code` command register automatically via Laravel
package auto-discovery.

## API key setup

Tackle uses Anthropic (Claude) by default. Add your key to `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

The `config/ai.php` published above already includes the `anthropic` provider
block — just add the env var and you're ready.

**Prefer another provider?** Any provider in `config/ai.php` works, e.g. OpenAI:

```env
AI_CODE_PROVIDER=openai
AI_CODE_MODEL=gpt-4o
OPENAI_API_KEY=sk-...
```

Budget rates resolve automatically from Tackle's built-in model catalog
(Anthropic, plus common OpenAI, Gemini, and Grok models — run `/model` in
`ai:code` to see them with their rates). For models the catalog doesn't know,
pin rates explicitly so budget enforcement stays meaningful — e.g. fully local
via Ollama, no API key, no cost:

```env
AI_CODE_PROVIDER=ollama
AI_CODE_MODEL=qwen3-coder
AI_CODE_PRICE_INPUT=0
AI_CODE_PRICE_OUTPUT=0
```

You can also teach the catalog new models (or correct a stale built-in rate)
in `config/tackle.php` under `pricing.models`. Non-Anthropic built-in rates
are best-effort snapshots — verify against your provider's pricing page when
the budget matters.

Switch models per session with `ai:code --model=... [--provider=...]` (also on
`ai:run`), or mid-session with `/model`.

::: tip Agent quality tracks the model
The coding and review agents lean heavily on tool calling, so weaker models
produce weaker results. The plumbing is neutral; our recommendation is Claude.
:::

## Verify the setup

```bash
php artisan tackle:health
```

This checks that the configs are published, an API key is configured for the
active provider, and the project is a git repository with at least one commit.
See [Utility Commands](/reference/commands#tackle-health) for the full list of
checks.

## Next steps

- [Run your first session](/guide/first-session)
- [Configuration](/guide/configuration) — shell modes, allowlists, budgets, worktrees
- [Environment variables](/reference/environment) — everything settable from `.env`
