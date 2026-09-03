# Slack

Drive a Tackle coding session from Slack. Send a task in a channel, watch it
work, press **Yes** when it asks before doing something destructive.

```bash
composer require jordandalton/tackle-slack
php artisan tackle:slack
```

## Why Slack, and why it still needs no public URL

[Tackle Remote](/integrations/remote) puts the agent in your phone's browser,
but the phone has to be able to *reach your machine*. [Telegram](/integrations/telegram)
fixed that for one person and a phone.

Slack is where a team already is. A session in a channel is one the whole team
can watch, and one where the approval a destructive step needs can come from
whoever is around — as long as they are on the list.

It stays **outbound only** through Socket Mode: a WebSocket your machine opens
*to* Slack. No public URL, no tunnel, no hosted process. The two other ways to
hear from Slack both fail that test — the Events API needs a URL Slack can POST
to, and polling `conversations.history` was rate-limited in 2025 to one call a
minute for apps not on the Marketplace.

## Setup

### 1. Create the app

Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** →
**From a manifest** — not "Create AI agent", which builds an agent Slack hosts.
Pick your workspace and paste this on the **JSON** tab:

```json
{
  "display_information": {
    "name": "Tackle",
    "description": "Drive a Laravel Tackle coding session from Slack"
  },
  "features": {
    "bot_user": { "display_name": "Tackle", "always_online": false },
    "slash_commands": [
      {
        "command": "/tackle",
        "description": "Talk to the Tackle session",
        "usage_hint": "help | clear | <task>",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write", "commands",
        "channels:history", "groups:history", "im:history", "mpim:history",
        "im:write", "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": ["message.channels", "message.groups", "message.im", "message.mpim"]
    },
    "interactivity": { "is_enabled": true },
    "socket_mode_enabled": true,
    "org_deploy_enabled": false,
    "token_rotation_enabled": false
  }
}
```

Then two tokens, from two different pages:

1. **OAuth & Permissions** → **Install to Workspace**. Copy the Bot User OAuth
   Token (`xoxb-…`) into `TACKLE_SLACK_BOT_TOKEN`.
2. **Basic Information** → **App-Level Tokens** → generate one with the
   `connections:write` scope. Copy it (`xapp-…`) into `TACKLE_SLACK_APP_TOKEN`.

The Client ID, Client Secret and Signing Secret on the credentials page are
not used.

Invite the app to the channel you want to use (`/invite @Tackle`), or open a
direct message with it.

### 2. Pair

Find out who is allowed to drive it. Send the app a message, then:

```bash
php artisan tackle:slack --pair
```

```
  U0123456789  Jordan Dalton  (channel C0123456789)
  TACKLE_SLACK_USERS=U0123456789
  TACKLE_SLACK_CHANNEL=C0123456789

  Allow Jordan Dalton to drive this project from this channel? (yes/no) [no]
```

Say yes and it writes both lines into `.env` — appending to the user list
rather than replacing it, so pairing a second person does not revoke the first,
and setting the channel only if nothing has chosen one yet. Then it exits,
because pairing is a setup step rather than a session.

It asks, and defaults to no, because this is the allowlist — the whole security
model — and the id on screen might belong to whoever else in the workspace
found the app. `--pair` acts on nothing it hears, so anyone can make it print
their id and none of them can make it do anything.

::: tip Stop any running session first
Slack spreads events across every open Socket Mode connection. A session
running alongside `--pair` will take turns swallowing your messages, and the
symptom is a bot that silently ignores you with nothing in any log to explain
why.
:::

### 3. Start a session

It stays in the foreground, like `ai:code`:

```bash
php artisan tackle:slack
php artisan tackle:slack --session=billing        # a separate conversation
php artisan tackle:slack --channel=D0123456789    # talk somewhere else this time
```

Leave `TACKLE_SLACK_CHANNEL` unset and the session opens a direct message with
the first allowed user.

## Security

::: danger The allowlist is the whole security model
**Anyone who can message this app can run code on the machine hosting it — and
in a channel, that is everyone in the channel.**

An unlisted user is not answered, not rate-limited, not asked to authenticate —
their message is dropped before it can reach the agent. An empty allowlist means
nobody, and the command refuses to start rather than quietly accepting the
workspace.
:::

::: warning Your code goes to Slack, and to the channel
The agent echoes file contents, stack traces and whatever else it reads. In a
direct message that is between you and Slack. In a channel it is between you,
Slack, and everyone who can read the channel — which is the point of a channel,
and also something to decide on purpose. For a client's project, or anything
with a compliance boundary, it may simply be a no.
:::

## What it's like to use

- **One message per turn**, edited as it grows — prose and tool calls together,
  the way the terminal renders it. Not six messages to say it read a file.
- **Quiet by default.** Slack only notifies about a channel message when it
  names you, so a question names whoever last spoke to the agent. Nothing else
  does — progress is for glancing at.
- **Approvals as buttons.** A press answers only the question currently open —
  by the time you look the agent may have moved on, and answering a question it
  is no longer asking is worse than missing one. The buttons are then replaced
  with the decision and who made it, so the channel shows a record rather than
  a live control someone else could press.
- **Markdown rendered** as Slack's own dialect: headings become bold, dashes
  become bullets, links become links.

## In your dev script

Laravel's `php artisan dev` has a registry you can add to, so the bot comes up
with the server, queue and Vite:

```php
// routes/console.php
use Illuminate\Foundation\DevCommands;

DevCommands::artisan('tackle:slack --if-configured', 'slack');
```

`--if-configured` idles instead of exiting when there is no token. That matters
in both runners, for opposite reasons: `composer dev` runs under
`concurrently --kill-others`, so an exit takes the whole environment down, while
`php artisan dev` restarts a crashed process, so it would spin forever. Run on
its own without a token it still fails loudly, because then you meant to start
it.

## Commands

Slack intercepts anything you type beginning with `/`, so `/clear` on its own
never reaches anyone. The manifest registers `/tackle` for that:

| | |
|---|---|
| `/tackle` or `@Tackle` | What this is and how to use it |
| `/tackle help` | Built-in and [project commands](/agents/interactive#custom-commands-tackle-commands) |
| `/tackle clear` | Forget the conversation and start fresh |
| `/tackle deploy-check` | Any command the session has published |
| `/tackle fix the tests` | Anything else after `/tackle` is a task |
| anything else | A task for the agent |

Restarting the command **resumes** the conversation rather than resetting it —
that is what the "Resumed session" line means. `/tackle clear`, or a new
`--session`, is what starting over actually looks like.

Files and images are not supported yet; the bot says so rather than ignoring
them.

## How it works

Nothing about the agent changes. Tackle Remote already separates the agent from
the way a human reaches it:

| Piece | Job | Browser-specific? |
|---|---|---|
| `SessionLoop` | Pops the inbox, drives the agent, appends events | No |
| `RemoteState` | inbox / events / question / answers, as files | No |
| `RemoteInteraction` | `InteractionPolicy` over that protocol | No |
| `server/router.php` | HTTP transport | Yes — and only this |

So the package adds **no `InteractionPolicy` and no agent code**. It is a pump
between that state directory and a channel. Every `ConfirmAction`, every
destructive `RunArtisan`, every [`MutateDatabase`](/guide/safety#database-writes)
commit routes to Slack automatically, because they already routed through
`InteractionPolicy`.

The only new machinery is a two-screen WebSocket client, because a library
would have been the package's one dependency.

## Troubleshooting

**Nothing arrives.** `TACKLE_SLACK_DEBUG=1` traces what the pump is doing —
which events it read, whether it posted or edited, and when the socket
reconnects.

**The app posts but never answers.** Almost always the allowlist. `--pair`
prints what Slack thinks your user id is; compare it with `TACKLE_SLACK_USERS`.
An unlisted user is dropped silently by design.

**`not_in_channel`.** The app has to be invited before it can post there:
`/invite @Tackle`.

**`channel_not_found`.** `TACKLE_SLACK_CHANNEL` wants the id (`C…`, `G…`,
`D…`), not the name. It is at the bottom of the channel's details pane.

**`/tackle` says "dispatch_failed".** The session is not running, so nothing
acknowledged the command. Start one.

## Related

- [Tackle Remote](/integrations/remote) — the browser UI and the state protocol this reuses
- [Telegram](/integrations/telegram) — the same idea for one person and a phone
- [tackle-slack on GitHub](https://github.com/JordanDalton/tackle-slack)
