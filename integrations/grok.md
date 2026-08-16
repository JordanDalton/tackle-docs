# Tackle Grok

**A Grok (xAI) provider for Laravel Tackle — run every agent on xAI's Grok
models, with an xAI API key or your grok.com plan.**

```env
AI_CODE_PROVIDER=grok
```

That's the whole switch. Every Tackle agent — `ai:code`, `ai:run`, `ai:fix`,
`ai:review`, the self-healer — now runs on xAI's Grok models.

This is a [`laravel/ai`](https://github.com/laravel/ai) provider under the
hood, so it also works in any `laravel/ai` app without Tackle.

## Two ways to authenticate

| Mode | What it does | Status |
|---|---|---|
| **`api-key`** | An xAI API key from [console.x.ai](https://console.x.ai) against `api.x.ai`. | **Recommended** — xAI's documented path for CI/CD, automation, and custom apps. |
| `subscription` | The Grok CLI's sign-in token against the CLI backend, on your grok.com plan. | Best-effort — see [the honest caveat](#subscription-mode-the-honest-version). |

`GROK_AUTH` selects the mode (`auto` by default: `subscription` when a Grok CLI
sign-in exists, otherwise `api-key`). Set `GROK_AUTH=api-key` to pin the
recommended path.

## Installation

The easiest path from a Tackle app:

```bash
php artisan tackle:install grok
```

Or via Composer directly:

```bash
composer require jordandalton/tackle-grok
php artisan vendor:publish --tag=tackle-grok-config   # optional
```

The service provider registers a `grok` driver with `laravel/ai`
automatically — no `config/ai.php` edits required.

## API-key mode (recommended)

Get a key from [console.x.ai](https://console.x.ai) and set it:

```env
GROK_AUTH=api-key
XAI_API_KEY=xai-...
```

This is the stock, documented xAI integration — the same `api.x.ai` endpoint
and API-key auth xAI publishes for building custom apps. Billing is metered
per token, so pin rates in `config/tackle.php` under `pricing.models` to keep
budget enforcement meaningful.

```bash
php artisan grok:status
php artisan ai:code --provider=grok --model=grok-4.6
```

## Subscription mode: the honest version

Subscription mode runs the agents on your **grok.com plan** by reusing the
Grok CLI's sign-in — the `~/.grok/auth.json` session token, sent to the CLI
backend.

::: warning Best-effort, not a documented integration path
Subscription mode **mimics the official Grok CLI**: the CLI backend rejects
requests that don't identify as the CLI (HTTP 426), so this mode sends the
same client-version headers the Grok CLI sends. xAI's *documented* paths for
custom apps are the [API](#api-key-mode-recommended) and Agent mode/ACP — not
this. xAI can change or gate the CLI backend at any time, and plan usage is
subject to your grok.com subscription's terms. Every endpoint and header lives
in config, so drift is an `.env` edit — but if your usage matters, prefer
api-key mode, or confirm subscription-backend use with xAI developer support
first.
:::

The Grok CLI owns the session — this package reads the token read-only and
never mints one. The CLI refreshes its own session in the background; when it
lapses, run `grok login`.

```bash
php artisan grok:status
```

```
  Mode ............................ subscription (plan-covered)
  Default model ................... grok-4.6
  Auth file ....................... /Users/you/.grok/auth.json
  Session token ................... valid, expires 2026-08-17 02:53 UTC
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `GROK_AUTH` | `auto` | `auto` \| `subscription` \| `api-key` |
| `XAI_API_KEY` / `GROK_API_KEY` | — | Key for api-key mode |
| `GROK_API_BASE_URL` | `https://api.x.ai/v1` | Endpoint for api-key mode |
| `GROK_AUTH_FILE` | `~/.grok/auth.json` | Grok CLI auth file (subscription mode) |
| `GROK_BASE_URL` | CLI backend | Endpoint for subscription mode |
| `GROK_MODEL` | `grok-4.6` | Default model in subscription mode |
| `GROK_CLIENT_VERSION` | `1.0.3` | Client-version header the CLI backend requires |

## Tackle integration

When subscription mode is active and `grok` is the active provider, the CLI
backend's models are registered in Tackle's
[pricing catalog](/guide/installation#api-key-setup) at **$0/MTok** — the
budget tracker stays accurate because your plan covers usage. The zero rates
apply *only* when this provider is active, so an api-key setup keeps real
rates. A leftover `claude-*`/`gpt-*` model default from another provider is
swapped for the Grok default automatically.

## How it works

`laravel/ai`'s xAI gateway already speaks the Responses API. This package
extends it with a `GrokProvider` that:

- in api-key mode, is the stock xAI provider — `api.x.ai`, bearer key, stock
  model defaults;
- in subscription mode, swaps the bearer for the Grok CLI session token,
  points the base URL at the CLI backend, and attaches the client-version
  headers that backend requires.

## Links

- [tackle-grok on GitHub](https://github.com/JordanDalton/tackle-grok)
