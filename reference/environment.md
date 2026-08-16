# Environment Variables

All config options can be set via `.env`. Nothing requires editing a PHP file.

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Your Anthropic API key (required for the default provider) |
| `AI_CODE_PROVIDER` | `anthropic` | Provider name — must match a key in `config/ai.php` |
| `AI_CODE_MODEL` | `claude-sonnet-4-6` | Model to use |
| `AI_CODE_MAX_STEPS` | `40` | Tool-call ceiling for `ai:run` — cannot exceed the agent's own `#[MaxSteps]` |
| `AI_CODE_BUDGET` | `1.00` | Hard spend limit in USD per session |
| `AI_CODE_COMPACTION_THRESHOLD` | `60000` | Conversation size (chars) that triggers automatic history compaction |
| `AI_CODE_COMPACTION_KEEP` | `4` | Recent messages kept verbatim when compacting |
| `AI_CODE_PRICE_INPUT` | auto | Input price per million tokens for budget estimation. Unset = resolved from the built-in model catalog (falls back to `3.00` for unknown models) |
| `AI_CODE_PRICE_OUTPUT` | auto | Output price per million tokens for budget estimation. Unset = resolved from the built-in model catalog (falls back to `15.00` for unknown models) |
| `AI_CODE_SHELL` | `approve` | Shell mode: `off` \| `allowlist` \| `approve` \| `yolo`. Can be set per-environment in `config/tackle.php` — production defaults to `off`. |
| `AI_CODE_WORKTREE` | `false` | Enable worktree isolation (production defaults to `true`). |
| `AI_CODE_MEMORY` | `file` | Session persistence: `file` (resume on next run) \| `none` |
| `AI_CODE_HEALING_ENABLED` | `false` | Enable the self-healing queue worker feature |
| `AI_CODE_HEALING_MODE` | `pr` | Healing mode: `pr` \| `patch` |
| `AI_CODE_HEALING_QUEUE` | `healer` | Queue name for the `HealJobFailure` job |
| `AI_CODE_HEALING_THRESHOLD` | `1` | Failures before healing is triggered |
| `AI_CODE_HEALING_BASE_BRANCH` | `main` | Base branch for fix pull requests |
| `AI_CODE_HEALING_BRANCH_PREFIX` | `tackle/heal-` | Prefix for fix branches |
| `AI_CODE_HEALING_TELESCOPE` | `true` | Use Telescope context if available |
| `AI_CODE_GUARD_SECRETS` | — | [Guard pack](/guide/safety#guard-pack): secret-exfiltration guard mode |
| `AI_CODE_GUARD_NETWORK` | `block` | Guard pack: network-exfiltration guard mode (`block` \| `confirm` \| `off`) |
| `AI_CODE_GUARD_COMPOSER` | — | Guard pack: composer-script guard mode |
| `AI_CODE_GUARD_INJECTION` | — | Enable the [injection shield](/guide/safety#injection-shield-experimental) classifier |
| `GITHUB_TOKEN` | — | GitHub token for opening pull requests and reading issues/PRs |
| `GITHUB_REPO` | — | Repository as `owner/repo` — activates the GitHub tools |
| `SENTRY_AUTH_TOKEN` | — | Sentry auth token with `issue:read` scope — activates `ReadSentryIssue` |
| `SENTRY_ORG` | — | Sentry organization slug |
| `SENTRY_PROJECT` | — | Sentry project slug — required for listing recent issues |

See also: [Configuration](/guide/configuration) for the full
`config/tackle.php` reference, and the
[Self-Healing configuration table](/agents/self-healing#configuration).
