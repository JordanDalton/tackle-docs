# Explain & Test

## Explain code

`php artisan ai:explain` reads a file or class and explains what it does in
plain English — inputs, outputs, side effects, and any non-obvious behaviour.
The agent reads the full file and any closely-related classes before
responding.

```bash
# Explain a whole file
php artisan ai:explain app/Services/BillingService.php

# Focus on a specific method
php artisan ai:explain app/Services/BillingService.php --method=charge
```

## Generate tests

`php artisan ai:test` reads a class, checks your existing test conventions,
and writes a Pest test file covering the happy path, edge cases, and error
conditions. It runs the tests after writing to confirm they pass.

```bash
# Generate tests for a class
php artisan ai:test app/Services/BillingService.php

# Focus on a single method
php artisan ai:test app/Services/BillingService.php --method=charge

# Force a feature or unit test
php artisan ai:test app/Http/Controllers/UserController.php --feature
php artisan ai:test app/Services/BillingService.php --unit
```

Test type is inferred from the path when no flag is given — controllers, jobs,
commands, listeners, and middleware default to `Feature`; everything else
defaults to `Unit`.

::: tip Inside a coding session
The main agent can also delegate test writing to the `test-writer`
[subagent](/extending/subagents) mid-session, keeping the main conversation
focused.
:::
