# Tackle Codex

**An OpenAI Codex provider for Laravel Tackle — run every agent on OpenAI's
Codex models, with your ChatGPT subscription or an API key.**

```env
AI_CODE_PROVIDER=codex
```

That's the whole switch. Every Tackle agent — `ai:code`, `ai:run`, `ai:fix`,
`ai:review`, the self-healer — now runs on OpenAI's Codex models. If you're
signed in to the [Codex CLI](https://developers.openai.com/codex/cli), usage
runs on your **ChatGPT plan** and records as **$0** in Tackle's budget;
otherwise it uses your OpenAI API key with metered billing.

This is a [`laravel/ai`](https://github.com/laravel/ai) provider under the
hood, so it also works in any `laravel/ai` app without Tackle.

## Installation

The easiest path from a Tackle app:

```bash
php artisan tackle:install codex
```

Or via Composer directly:

```bash
composer require jordandalton/tackle-codex
php artisan vendor:publish --tag=tackle-codex-config   # optional
```

The service provider registers a `codex` driver with `laravel/ai`
automatically — no `config/ai.php` edits required (add a
`'codex' => ['driver' => 'codex']` entry if you prefer it explicit).

## Authentication

Two modes, resolved by `CODEX_AUTH` (default `auto`):

| Mode | What it does |
|---|---|
| `chatgpt` | Uses the sign-in-with-ChatGPT tokens from the Codex CLI's `auth.json`. Requests go to the ChatGPT Codex backend and are covered by your ChatGPT plan — no per-token billing. |
| `api-key` | Uses `OPENAI_API_KEY` (or `CODEX_API_KEY`) against the public OpenAI API, like the stock `openai` provider pointed at Codex models. |
| `auto` | `chatgpt` when a usable auth file exists, otherwise `api-key`. |

### ChatGPT mode (subscription)

Log in once with the Codex CLI:

```bash
codex login
```

Tackle Codex reads (and refreshes) the same `~/.codex/auth.json` the CLI
uses, so one login serves both. Check what will happen before your first
session:

```bash
php artisan codex:status
```

```
  Mode ............................ chatgpt (plan-covered)
  Default model ................... gpt-5.6-terra
  Auth file ....................... /Users/you/.codex/auth.json
  Account ......................... a1b2c3d4…
  Access token .................... valid, expires 2026-08-16 22:14 UTC
```

Access tokens are refreshed automatically shortly before expiry and written
back to the auth file. The auth file location honours `$CODEX_HOME` and can
be overridden with `CODEX_AUTH_FILE`.

### API-key mode

```env
CODEX_AUTH=api-key
OPENAI_API_KEY=sk-...
```

## Configuration

Everything is env-tunable; publish the config for the full list:

| Variable | Default | Description |
|---|---|---|
| `CODEX_AUTH` | `auto` | `auto` \| `chatgpt` \| `api-key` |
| `CODEX_AUTH_FILE` | `~/.codex/auth.json` | Codex CLI auth file location |
| `CODEX_API_KEY` | `OPENAI_API_KEY` | Key for api-key mode |
| `CODEX_MODEL` | `gpt-5.6-terra` | Default model |
| `CODEX_BASE_URL` | ChatGPT Codex backend | Endpoint for chatgpt mode |
| `CODEX_API_BASE_URL` | `https://api.openai.com/v1` | Endpoint for api-key mode |

Pick the model per session as usual:

```bash
php artisan ai:code --provider=codex
php artisan ai:run "..." --provider=codex --model=gpt-5.6-terra
```

## Tackle integration

When chatgpt mode is active, the Codex models are registered in Tackle's
[pricing catalog](/guide/installation#api-key-setup) at **$0/MTok** — the
budget tracker stays accurate (your plan covers usage) and the
[`/model` picker](/agents/interactive#slash-commands) knows the models. In
api-key mode, pin real rates in `config/tackle.php` under `pricing.models`
so budget enforcement stays meaningful.

Tackle's own `AI_CODE_MODEL` default is a Claude model; when the provider is
`codex` and the configured model is a leftover `claude-*` default, it is
swapped for the Codex default automatically — `AI_CODE_PROVIDER=codex`
really is the only env var you need.

## How it works

`laravel/ai`'s OpenAI gateway already speaks the Responses API. This package
extends it with a `CodexProvider` + `CodexGateway` pair that:

- swaps the bearer token for a ChatGPT access token (with automatic refresh
  through the OAuth token endpoint, shared with the Codex CLI's session);
- adds the `chatgpt-account-id`, `originator`, and session headers the Codex
  backend expects;
- targets `chatgpt.com/backend-api/codex` and forces stateless requests
  (`store: false`), with encrypted reasoning carried between steps;
- serves non-streaming calls by draining a stream, since the Codex backend
  only streams.

In api-key mode none of that applies — it is the stock OpenAI Responses flow
with Codex model defaults.

## Caveats, honestly stated

::: warning Not a public, versioned API
The ChatGPT Codex backend can change endpoints, headers, or model names at
any time, and plan usage is subject to ChatGPT's terms and rate limits.
Every endpoint and header lives in config so a change is an `.env` edit, but
treat chatgpt mode as best-effort. API-key mode is the stable path.
:::

- **Tackle's model-quality note applies.** The agents lean heavily on tool
  calling; results track the model you point them at — see
  [Models & Providers](/extending/models).
- **`laravel/ai` version coupling.** The gateway extends `laravel/ai`
  internals; the package pins `>=0.10 <0.11` and follows the same
  known-risks posture as [core Tackle](/reference/limitations#known-risks).

## Links

- [tackle-codex on GitHub](https://github.com/JordanDalton/tackle-codex)
