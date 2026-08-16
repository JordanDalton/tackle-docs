# Models & Providers

Tackle is built on [`laravel/ai`](https://github.com/laravel/ai) and is
**provider-agnostic** like it: any provider `laravel/ai` supports with tool
calling works. Anthropic (Claude) is the default.

## Changing the model or provider

The quickest way is via `.env`:

```env
AI_CODE_PROVIDER=openai
AI_CODE_MODEL=gpt-4o
```

The provider name must match a key in `config/ai.php`. Any provider supported
by `laravel/ai` (Anthropic, OpenAI, Gemini, Groq, Ollama, etc.) works as long
as it supports tool calling.

When switching models, also set `AI_CODE_PRICE_INPUT` / `AI_CODE_PRICE_OUTPUT`
to the model's per-million-token rates — the budget cap is estimated from
token counts, and the defaults assume Claude Sonnet pricing. For local models
set both to `0`:

```env
AI_CODE_PROVIDER=ollama
AI_CODE_MODEL=qwen3-coder
AI_CODE_PRICE_INPUT=0
AI_CODE_PRICE_OUTPUT=0
```

## The model catalog

Budget rates resolve automatically from Tackle's built-in model catalog
(Anthropic, plus common OpenAI, Gemini, and Grok models — run `/model` in
`ai:code` to see them with their rates). For models the catalog doesn't know,
pin rates explicitly so budget enforcement stays meaningful.

You can also teach the catalog new models (or correct a stale built-in rate)
in `config/tackle.php` under `pricing.models`. Non-Anthropic built-in rates
are best-effort snapshots — verify against your provider's pricing page when
the budget matters.

## Per-session and mid-session switching

Switch models per session with `ai:code --model=... [--provider=...]` (also
on `ai:run`), or mid-session with the
[`/model` slash command](/agents/interactive#slash-commands) — no name shows
a picker listing known models with their per-MTok rates.

## How it's wired

Internally, Tackle injects provider and model values via two custom Laravel
contextual attributes — `#[AiProvider]` and `#[AiModel]` — so any agent you
write by extending `DefaultCodingAgent` inherits these config values
automatically through the container.

::: tip Agent quality tracks the model
The coding and review agents lean heavily on tool calling, so weaker models
produce weaker results. The plumbing is neutral; our recommendation is Claude.
:::
