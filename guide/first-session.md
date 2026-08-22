# Your First Session

```bash
php artisan ai:code
```

Type a task at the prompt. The agent maintains full conversation history within
a session, so you can follow up, ask questions, and give corrections naturally.

Type `exit` or `quit` to end the session.

For CI, cron, or anything without a terminal, use
[`ai:run`](/agents/headless) — the same agent, run once, with a structured
result and an exit code.

## Example session

```
 ┌──────────────────────────────────────────────────────────────┐
 │  Laravel Tackle  ·  claude-sonnet-4-6  ·  $1.00  ·  approve │
 └──────────────────────────────────────────────────────────────┘

 ┌ What should I work on? ─────────────────────────────────────┐
 │ Add a slug field to the Post model                          │
 └─────────────────────────────────────────────────────────────┘

  🔍 searching for Post model
  📖 reading app/Models/Post.php
  📝 creating database/migrations/2024_01_01_add_slug_to_posts.php
  ✓ File saved
  ✏️  editing app/Models/Post.php
  ✓ File saved
  🧪 running tests
  ✓ Done

 Migration created, `$fillable` updated, and all tests pass.

 ╭─────────────────────────────────────────────────────────────╮
 │  app/Models/Post.php | 2 +-                                 │
 │  1 migration file    | 15 +++++++++++++++                   │
 ╰─────────────────────────────────────────────────────────────╯

 ┌ What should I work on? ─────────────────────────────────────┐
 │ Make the slug auto-generate from the title on creation  ▲   │
 │ Add a slug field to the Post model                      ▼   │
 └─────────────────────────────────────────────────────────────┘
```

## Tips for better results

**Be specific about what you want.**
Vague tasks produce vague results. The more context you give upfront, the less
back-and-forth is needed.

| Instead of… | Try… |
|---|---|
| "Add a feature" | "Add a `published_at` timestamp to `Post` with a scope for published posts and a migration" |
| "Fix the bug" | "The `UserController@store` is returning a 500 when `email` is null — find out why and fix it" |
| "Refactor this" | "The `OrderService` class is doing too much — extract the payment logic into a `PaymentService`" |

**Use `--off` for questions and exploration.**
If you just want to understand the codebase without making changes, `--off`
mode prevents the agent from running any commands, so you can ask freely.

```bash
php artisan ai:code --off
# "How is authentication handled in this app?"
# "What does the Job queue setup look like?"
```

**Point it at the right place.**
If you know which file or module is relevant, say so. "Look at
`app/Services/BillingService.php`" is faster than letting it search from
scratch.

**Correct it mid-session.**
If the agent does something wrong, just say so in the next prompt. It reads
your correction in context and adjusts. You don't need to restart the session.

**Keep tasks focused.**
One clear task per session works better than a long list. Once a task is done,
review the diff, commit it, then start a new session for the next task.

**Review before you move on.**
After each task the agent shows a `git diff --stat`. Look at it before typing
your next task. If something looks wrong, say so or discard with
`git checkout -- .`.

## Where to go from here

- [Interactive Coding (ai:code)](/agents/interactive) — shell modes, worktrees,
  plan mode, slash commands, images, and everything else the REPL can do.
- [Project Instructions](/guide/project-instructions) — record your conventions
  once in `TACKLE.md` instead of repeating them in every prompt.
- [Session Memory](/guide/session-memory) — sessions resume where you left off.
- [Onboard a Developer (ai:onboard)](/agents/onboard) — new to this codebase
  yourself? Let the agent give you the tour first.
