# Telegram

Drive a Tackle coding session from Telegram. Send a task, watch it work, tap
**Yes** when it asks before doing something destructive.

```bash
composer require jordandalton/tackle-telegram
php artisan tackle:telegram
```

## Why Telegram solves a problem the browser doesn't

[Tackle Remote](/integrations/remote) puts the agent in your phone's browser,
but the phone has to be able to *reach your machine* — same network, or a
tunnel.

Telegram is **outbound only**. `getUpdates` is a long poll your machine opens
*to* Telegram, so a laptop behind NAT with no public URL, no tunnel and no
hosted process can be driven from anywhere in the world. Telegram's servers are
the relay, and they are free.

## Setup

Get a token from [@BotFather](https://t.me/botfather):

```env
TACKLE_TELEGRAM_TOKEN=123456:ABC...
```

Then find out which chat is allowed to drive it. Open your bot in Telegram,
send it anything, and run:

```bash
php artisan tackle:telegram --pair
```

```
  8271428961  Jordan D @heliguy84  (private)
  TACKLE_TELEGRAM_CHATS=8271428961

  Allow Jordan D @heliguy84 to drive this project? (yes/no) [no]
```

Say yes and it writes the line into `.env`, appending rather than replacing so
pairing a second device does not revoke the first — then it exits, because
pairing is a setup step rather than a session. A chat that is already allowed
skips the question and says so.

It asks, and defaults to no, because this is the allowlist — the whole security
model — and the id on screen might belong to whoever else found your bot. A
human confirming they recognise the name is the check. `--pair` itself acts on
nothing it hears, so anyone can make it print their id and none of them can make
it do anything.

::: tip Stop any running session first
Telegram delivers each update exactly once, to whoever asks for it first. A
session polling alongside `--pair` will take turns swallowing your messages,
and the symptom is a bot that silently ignores you with nothing in any log to
explain why.
:::

Then start a session. It stays in the foreground, like `ai:code`:

```bash
php artisan tackle:telegram
php artisan tackle:telegram --session=billing   # a separate conversation
php artisan tackle:telegram --chat=987654321    # which allowed chat to talk to
```

## Security

::: danger The allowlist is the whole security model
A bot token is far more discoverable than a pairing code shown in your terminal,
and **anyone who can message this bot can run code on the machine hosting it.**

An unlisted chat is not answered, not rate-limited, not asked to authenticate —
its message is dropped before it can reach the agent. An empty allowlist means
nobody, and the command refuses to start rather than quietly accepting everyone.
:::

::: warning Your code goes to Telegram
The agent echoes file contents, stack traces and whatever else it reads into the
chat. For your own projects that is a choice you can make. For a client's, or
anything with a compliance boundary, it may simply be a no — and that is better
decided now than discovered in a transcript.
:::

## What it's like to use

Built for a phone in a pocket rather than a terminal on a desk:

- **One message per turn**, edited as it grows — prose and tool calls together,
  the way the terminal renders it. Not six notifications to say it read a file.
- **Silent by default.** The only thing that buzzes your phone is a question the
  agent is blocked on. That is the notification this exists to deliver, and it
  is worth nothing if it arrives alongside five others.
- **Approvals as inline buttons.** A tap answers only the question currently
  open — by the time you reach your phone the agent may have moved on, and
  answering a question it is no longer asking is worse than missing one.
- **Markdown rendered**, not printed as asterisks.

## In your dev script

Laravel's `php artisan dev` has a registry you can add to, so the bot comes up
with the server, queue and Vite:

```php
// routes/console.php
use Illuminate\Foundation\DevCommands;

DevCommands::artisan('tackle:telegram --if-configured', 'telegram');
```

`--if-configured` idles instead of exiting when there is no token. That matters
in both runners, for opposite reasons: `composer dev` runs under
`concurrently --kill-others`, so an exit takes the whole environment down, while
`php artisan dev` restarts a crashed process, so it would spin forever. Run on
its own without a token it still fails loudly, because then you meant to start
it.

## Commands

| | |
|---|---|
| `/start` | What this is and how to use it |
| `/help` | Built-in and [project commands](/agents/interactive#custom-commands-tackle-commands) |
| `/clear` | Forget the conversation and start fresh |
| anything else | A task for the agent |

Restarting the command **resumes** the conversation rather than resetting it —
that is what the "Resumed session" line means. `/clear`, or a new `--session`,
is what starting over actually looks like.

Voice notes and photos are not supported yet; the bot says so rather than
ignoring them.

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
between that state directory and a chat. Every `ConfirmAction`, every
destructive `RunArtisan`, every [`MutateDatabase`](/guide/safety#database-writes)
commit routes to Telegram automatically, because they already routed through
`InteractionPolicy`.

## Troubleshooting

**Nothing arrives.** `TACKLE_TELEGRAM_DEBUG=1` traces what the pump is doing —
which events it read, and whether it sent or edited.

**A group chat ignores you.** Telegram bots have privacy mode on by default and
only see messages that start with `/` or reply to the bot. Turn it off in
@BotFather, or use a direct chat.

**`getUpdates` fails outright.** A webhook set on the bot disables polling.
Remove it with `deleteWebhook`.

## Related

- [Tackle Remote](/integrations/remote) — the browser UI and the state protocol this reuses
- [Slack](/integrations/slack) — the same idea for a team, in a channel
- [tackle-telegram on GitHub](https://github.com/JordanDalton/tackle-telegram)
