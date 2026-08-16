import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Laravel Tackle',
  description:
    'An AI agent harness for Laravel — coding agents, code review, dependency upgrades, and self-healing, with safety boundaries enforced at the framework level.',
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,
  srcExclude: ['README.md'],
  sitemap: {
    hostname: 'https://tackle.jordandalton.com',
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['meta', { property: 'og:site_name', content: 'Laravel Tackle' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://tackle.jordandalton.com/og.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://tackle.jordandalton.com/og.png' }],
  ],
  transformPageData(pageData, { siteConfig }) {
    const site = siteConfig.site
    const path = pageData.relativePath
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')
    const url = `https://tackle.jordandalton.com/${path}`
    const title = pageData.title ? `${pageData.title} | ${site.title}` : site.title
    const description = pageData.description || site.description

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['link', { rel: 'canonical', href: url }],
    )
  },
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Guide', link: '/guide/what-is-tackle', activeMatch: '^/guide/' },
      { text: 'Agents', link: '/agents/interactive', activeMatch: '^/agents/' },
      { text: 'Extending', link: '/extending/custom-tools', activeMatch: '^/extending/' },
      { text: 'Reference', link: '/reference/tools', activeMatch: '^/reference/' },
      {
        text: 'Ecosystem',
        items: [
          { text: 'Tackle Remote', link: '/integrations/remote' },
          { text: 'Tackle Review (GitHub Action)', link: '/integrations/review-action' },
          { text: 'MCP Server', link: '/integrations/mcp' },
        ],
      },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'What is Tackle?', link: '/guide/what-is-tackle' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Your First Session', link: '/guide/first-session' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Project Instructions (TACKLE.md)', link: '/guide/project-instructions' },
          { text: 'Session Memory', link: '/guide/session-memory' },
          { text: 'Safety', link: '/guide/safety' },
        ],
      },
      {
        text: 'The Agents',
        items: [
          { text: 'Interactive Coding (ai:code)', link: '/agents/interactive' },
          { text: 'Headless Runs (ai:run)', link: '/agents/headless' },
          { text: 'Fix an Issue (ai:fix)', link: '/agents/fix' },
          { text: 'Code Review (ai:review)', link: '/agents/review' },
          { text: 'Explain & Test', link: '/agents/explain-and-test' },
          { text: 'Dependency Upgrades (ai:upgrade)', link: '/agents/upgrade' },
          { text: 'Self-Healing', link: '/agents/self-healing' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'GitHub Issues', link: '/integrations/github' },
          { text: 'Sentry', link: '/integrations/sentry' },
          { text: 'MCP Server', link: '/integrations/mcp' },
          { text: 'Tackle Remote', link: '/integrations/remote' },
          { text: 'Tackle Review (GitHub Action)', link: '/integrations/review-action' },
        ],
      },
      {
        text: 'Extending Tackle',
        items: [
          { text: 'Custom Tools', link: '/extending/custom-tools' },
          { text: 'Custom Agents', link: '/extending/custom-agents' },
          { text: 'Subagents', link: '/extending/subagents' },
          { text: 'Hooks', link: '/extending/hooks' },
          { text: 'Events', link: '/extending/events' },
          { text: 'Models & Providers', link: '/extending/models' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Built-in Tools', link: '/reference/tools' },
          { text: 'Environment Variables', link: '/reference/environment' },
          { text: 'Utility Commands', link: '/reference/commands' },
          { text: 'Troubleshooting', link: '/reference/troubleshooting' },
          { text: 'Limitations & Known Risks', link: '/reference/limitations' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/JordanDalton/laravel-tackle' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Jordan Dalton',
    },
    outline: { level: [2, 3] },
  },
})
