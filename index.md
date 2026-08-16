---
layout: home

hero:
  name: Laravel Tackle
  text: An AI agent harness for Laravel
  tagline: Coding agents that read your codebase, run your tests, review your PRs, upgrade your dependencies, and heal your failed jobs — installed via Composer, with safety boundaries enforced at the framework level.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/what-is-tackle
    - theme: alt
      text: Installation
      link: /guide/installation
    - theme: alt
      text: GitHub
      link: https://github.com/JordanDalton/laravel-tackle

features:
  - icon: 💻
    title: Interactive coding agent
    details: php artisan ai:code opens a full coding session in your terminal — plan mode, slash commands, image input, session memory, and automatic context compaction.
    link: /agents/interactive
  - icon: 🤖
    title: Headless for CI and cron
    details: ai:run is the same agent with no terminal — one task, a JSON result, and an exit code. Drop it into GitHub Actions or the scheduler.
    link: /agents/headless
  - icon: 🔎
    title: AI code review on every PR
    details: ai:review posts inline review comments with severity levels, re-reviews only what changed on each push, and can gate merges. Reviewers type /tackle fix this and the agent pushes the fix.
    link: /agents/review
  - icon: 🩹
    title: Self-healing apps
    details: A failed queue job or scheduled task triggers an agent that diagnoses the exception in an isolated worktree, patches the code, runs your tests, and opens a PR.
    link: /agents/self-healing
  - icon: ⬆️
    title: Careful major upgrades
    details: ai:upgrade audits what is upgradable, plans from the package's own upgrade guide, fixes the breaking changes, and verifies with your test suite — one reviewable PR per package.
    link: /agents/upgrade
  - icon: 🛡️
    title: Safety enforced in PHP
    details: Protected paths, per-environment shell modes, artisan allowlists, spend budgets, and worktree isolation — enforced in code, not by prompting the model nicely.
    link: /guide/safety
  - icon: 📱
    title: Drive it from your phone
    details: Tackle Remote serves a mobile browser UI for the same harness — send tasks with photos, watch tool calls live, and answer approval prompts from a bottom sheet.
    link: /integrations/remote
  - icon: 🔌
    title: Provider-agnostic, MCP-ready
    details: Built on laravel/ai — Anthropic by default; OpenAI, Gemini, Groq, or local Ollama are two env vars away. Tackle's Laravel-aware tools also serve any MCP client.
    link: /extending/models
---
