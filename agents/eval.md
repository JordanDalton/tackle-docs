# Benchmark the Agent (ai:eval)

`php artisan ai:eval` runs the coding agent against a set of seeded bugs and
reports how it did — so a change to prompts, tools, or the safety layer can be
**measured** instead of guessed at. It is the harness's own benchmark.

```bash
php artisan ai:eval                     # the built-in suite
php artisan ai:eval --case=div-by-zero  # one case (repeatable)
php artisan ai:eval --model=... --budget=0.50
php artisan ai:eval --json              # machine-readable, for CI
```

## How a case is graded

Each case seeds one buggy class into an isolated directory, hands the agent a
prompt, and grades the result **in a subprocess** — so a fix that leaves the
file unparseable, or throws, is scored as a failure rather than taking the run
down, and cases never collide in one PHP process.

The report gives:

- **fix rate** — cases where the target behaviour is now correct;
- **false-fix rate** — cases the agent "fixed" while regressing a
  previously-correct behaviour. Tracked separately because it is the most
  dangerous outcome: a green-looking change that is actually wrong;
- **not-fixed** and **errors**;
- **tokens and cost**, per case and in total.

The command exits non-zero if any case regressed or errored, so it can gate a
CI job.

## Adding your own cases

Drop `*.php` files in your project's `evals/` directory (configurable via
`tackle.evals.path`). Each file returns an `EvalCase` — or an array of them —
and is merged into the suite; a case whose `id` matches a built-in overrides it.
Set `tackle.evals.include_builtin` to `false` to run only your own.

```php
// evals/refund-rounding.php
use Tackle\Evals\EvalCase;
use Tackle\Evals\Probe;

return new EvalCase(
    id: 'refund-rounding',
    title: 'Refund amount is rounded down, losing a cent',
    category: 'bug',
    files: [
        'Refund.php' => <<<'PHP'
        <?php
        class Refund {
            public function cents(float $dollars): int { return (int) ($dollars * 100); }
        }
        PHP,
    ],
    prompt: "Refund::cents() truncates instead of rounding — 19.99 dollars becomes 1998 cents. Fix it to round to the nearest cent.",
    // The probe runs in a subprocess: set $target (bug fixed) and $happy
    // (previously-correct behaviour still holds).
    grader: Probe::subprocess('Refund.php', '
        $r = new Refund();
        $target = $r->cents(19.99) === 1999;
        $happy  = $r->cents(10.00) === 1000;
    '),
);
```

Keep each case small, pure, and unambiguous — one class, one clear bug, and a
grader that checks both the fix and that the happy path still holds — so grading
stays deterministic and cheap. Graders run in a subprocess, so a fix that leaves
the file unparseable scores as a failure rather than crashing the run.

The built-in cases live in `Tackle\Evals\CaseRepository` if you'd like
examples to copy.

::: tip Why it matters
Every other improvement to the harness — [structured test output](/agents/self-healing),
the [healer verification gate](/agents/self-healing#verification-gate), context
guards — was worth building, but without a benchmark you can't tell whether the
next change helped or hurt. `ai:eval` turns "did that help?" into a number.
:::
