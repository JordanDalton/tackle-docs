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

## Adding cases

Cases live in `Tackle\Evals\CaseRepository`. Keep each one small, pure, and
unambiguous — a single class with one clear bug and a grader that checks both
the target behaviour and that the happy path still holds — so grading stays
deterministic and cheap.

::: tip Why it matters
Every other improvement to the harness — [structured test output](/agents/self-healing),
the [healer verification gate](/agents/self-healing#verification-gate), context
guards — was worth building, but without a benchmark you can't tell whether the
next change helped or hurt. `ai:eval` turns "did that help?" into a number.
:::
