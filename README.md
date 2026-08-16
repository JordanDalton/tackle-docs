# tackle-docs

Documentation site for [Laravel Tackle](https://github.com/JordanDalton/laravel-tackle),
served at [tackle.jordandalton.com](https://tackle.jordandalton.com).

Built with [VitePress](https://vitepress.dev).

## Development

```bash
npm install
npm run docs:dev       # local dev server with hot reload
npm run docs:build     # production build to .vitepress/dist
npm run docs:preview   # preview the production build
```

## Deployment

Hosted on Laravel Forge as a static site: pushes to `main` trigger a Quick
Deploy that runs `npm ci && npm run docs:build`, and nginx serves
`.vitepress/dist` as the web directory.

## Structure

- `index.md` — landing page
- `guide/` — getting started + core concepts (installation, configuration, safety)
- `agents/` — one page per agent command (`ai:code`, `ai:run`, `ai:review`, …)
- `integrations/` — GitHub, Sentry, MCP, Tackle Remote, Tackle Review action
- `extending/` — custom tools/agents, subagents, hooks, events, providers
- `reference/` — built-in tools, env vars, utility commands, troubleshooting

Content is sourced from the READMEs of `laravel-tackle`,
`laravel-tackle-remote`, and `tackle-review` — when those change, the
corresponding pages here should be updated to match.
