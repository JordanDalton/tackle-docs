# GitHub Issues Integration

When `GITHUB_TOKEN` and `GITHUB_REPO` are set, the `ReadGitHubIssue` tool
becomes active. The agent can fetch any issue by number — title, description,
labels, and all comments — giving it full context before starting work.

## Configuration

Add these to your `.env`:

```env
GITHUB_TOKEN=ghp_...        # personal access token with repo scope
GITHUB_REPO=owner/repo      # e.g. acme/my-app
```

The `GITHUB_TOKEN` is shared with the [self-healer](/agents/self-healing)
(PR mode), so no extra setup is needed if healing is already configured.
Generate a token at **GitHub → Settings → Developer settings → Personal access
tokens** with `repo` scope (or a fine-grained token with **Issues: read**
permission).

## How it works

Ask the agent naturally:

```
> implement issue #42
> what are the open GitHub issues?
```

When given an issue number, the tool fetches the issue body plus all comments
and returns them as a single block of context. When no number is given, it
returns a summary list of recent open issues (pull requests are filtered out
automatically).

The same credentials also power:

- [`ai:fix --issue=N`](/agents/fix) — a fix session seeded from an issue
- [`ai:review --pr=N`](/agents/review#reviewing-pull-requests) — pull request
  review via the GitHub API
- The `ReadPullRequest`, `CreateGitHubIssue`, `CreatePullRequest`, and
  `CommitAndPush` [tools](/reference/tools#observability)

## Health check

```bash
php artisan tackle:health
```

Reports `✓ GitHub configured (owner/repo) — ReadGitHubIssue tool is active`
when both vars are present.

::: warning Untrusted input
Issue bodies and comments are text anyone can write on a public repository,
and they are fed to an agent that can edit code. See
[What the guards do and don't stop](/guide/safety#what-the-guards-do-and-don-t-stop)
and consider the
[injection shield](/guide/safety#injection-shield-experimental) for
issue-driven runs.
:::
