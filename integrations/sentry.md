# Sentry Integration

When `SENTRY_AUTH_TOKEN` and `SENTRY_ORG` are set, the `ReadSentryIssue` tool
becomes active. The agent can fetch the latest event for any Sentry issue —
including the full exception, stacktrace, breadcrumbs, and HTTP request
context — and use it as additional context when diagnosing bugs.

## Configuration

Add these to your `.env`:

```env
SENTRY_AUTH_TOKEN=sntrys_...   # auth token with issue:read scope
SENTRY_ORG=your-org-slug       # visible in your Sentry URL (sentry.io/organizations/<slug>/)
SENTRY_PROJECT=your-project    # project slug — required for listing recent issues
```

These are the same env vars used by the
[Sentry CLI](https://docs.sentry.io/cli/), so no extra setup is needed if you
already use it.

Generate a token at **Sentry → Settings → Account → API → Auth Tokens** with
the `issue:read` scope.

## How it works

Ask the agent naturally:

```
> there's a DivisionByZeroError in Sentry (#4821) — can you fix it?
> what are my recent unresolved Sentry issues?
```

When given an issue ID, the tool calls
`GET /api/0/organizations/{org}/issues/{id}/events/latest/` and returns the
exception type, message, stacktrace (top 15 frames, most recent first),
breadcrumbs (last 10), and request method/URL.

When no ID is given, it calls
`GET /api/0/projects/{org}/{project}/issues/` and returns a summary list of
recent unresolved issues.

The same credentials also power [`ai:fix --sentry=ID`](/agents/fix) — a fix
session seeded straight from a Sentry issue.

## Health check

```bash
php artisan tackle:health
```

Reports `✓ Sentry configured — ReadSentryIssue tool is active` when
credentials are present, or a warning with setup instructions if they are
missing.
