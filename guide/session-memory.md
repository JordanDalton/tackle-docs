# Session Memory

The `memory` config controls what happens to conversation history when you
exit.

| Mode | Behaviour |
|---|---|
| `file` | **(Default)** The transcript is saved to `storage/ai-code/` after every turn. Re-running `ai:code` resumes where you left off. |
| `none` | History is lost when the session ends. Every `php artisan ai:code` starts fresh. |

With `file` mode you'll see this on your next run:

```
Resumed session 'default' — 12 messages of history. Type /clear to start fresh.
```

## Named sessions

`--session` keeps separate histories for separate streams of work:

```bash
php artisan ai:code --session=billing-refactor
php artisan ai:code --session=bugfixes
```

`ai:run` joins a persisted session only when `--session` is passed — anonymous
one-shot runs never pollute your interactive history. That means a cron'd
`ai:run --session=nightly` accumulates context across nights.

## Notes

- Transcripts are JSON under `storage/ai-code/` — delete a file (or `/clear`
  in the REPL) to forget a session; gitignore the directory to keep history
  out of your repository.
- [Context compaction](/agents/interactive#context-compaction) applies to
  resumed sessions too: a long transcript is summarized before it eats your
  context window.
- Image attachments are not persisted — re-attach an image if a later session
  needs it.
- Text is persisted, not tool output: a resumed session remembers what was
  said and done, and the agent re-reads files as needed.
