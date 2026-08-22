import { defineConfig } from 'vitepress'

// Same algorithm as VitePress's internal createTitle(), so transformPageData
// can emit og:title / twitter:title that match the rendered <title> exactly.
function resolveTitle(site, pageData) {
  const title = pageData.title || site.title
  const template = pageData.titleTemplate ?? site.titleTemplate
  if (typeof template === 'string' && template.includes(':title')) {
    return template.replace(/:title/g, title)
  }
  const suffix =
    template === false
      ? ''
      : template === true || template === undefined
        ? ` | ${site.title}`
        : site.title === template
          ? ''
          : ` | ${template}`
  return title === suffix.slice(3) ? title : `${title}${suffix}`
}

export default defineConfig({
  title: 'Laravel Tackle',
  description:
    'An AI agent harness for Laravel — coding agents, code review, dependency upgrades, and self-healing, with safety boundaries enforced at the framework level.',
  lang: 'en-US',
  lastUpdated: true,
  // cleanUrls is off: the site is served as static files by nginx (Forge)
  // with no extensionless-path rewrite, so links carry the real .html the
  // server can find. Flip to true only alongside an nginx
  // `try_files $uri $uri.html $uri/ =404;` rule.
  cleanUrls: false,
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
    // Match the non-clean URLs the pages are actually served at: the root
    // and directory indexes stay extensionless, every other page ends .html.
    const raw = pageData.relativePath
    const path = raw === 'index.md'
      ? ''
      : raw.endsWith('/index.md')
        ? raw.replace(/index\.md$/, '')
        : raw.replace(/\.md$/, '.html')
    const url = `https://tackle.jordandalton.com/${path}`
    // Mirror VitePress's own <title> resolution so the social/canonical tags
    // never drift from what the browser tab shows — including pages (the home
    // page especially) that override titleTemplate.
    const title = resolveTitle(site, pageData)
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
          { text: 'Tackle Codex (OpenAI)', link: '/integrations/codex' },
          { text: 'Tackle Grok (xAI)', link: '/integrations/grok' },
          { text: 'MCP Server', link: '/integrations/mcp' },
          { text: 'Laravel Nightwatch', link: '/integrations/nightwatch' },
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
          { text: 'Onboard a Developer (ai:onboard)', link: '/agents/onboard' },
          { text: 'Dependency Upgrades (ai:upgrade)', link: '/agents/upgrade' },
          { text: 'Self-Healing', link: '/agents/self-healing' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'GitHub Issues', link: '/integrations/github' },
          { text: 'Sentry', link: '/integrations/sentry' },
          { text: 'Laravel Nightwatch', link: '/integrations/nightwatch' },
          { text: 'MCP Server', link: '/integrations/mcp' },
          { text: 'Tackle Remote', link: '/integrations/remote' },
          { text: 'Tackle Review (GitHub Action)', link: '/integrations/review-action' },
          { text: 'Tackle Codex (OpenAI)', link: '/integrations/codex' },
          { text: 'Tackle Grok (xAI)', link: '/integrations/grok' },
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
      { icon: 'x', link: 'https://x.com/jordankdalton', ariaLabel: 'Jordan Dalton on X' },
      { icon: 'youtube', link: 'https://youtube.com/@daltoncast', ariaLabel: 'DaltonCast on YouTube' },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 0 1 5.08 16zm2.95-8H5.08a7.987 7.987 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>',
        },
        link: 'https://jordandalton.com',
        ariaLabel: "Jordan Dalton's website",
      },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Jordan Dalton',
    },
    outline: { level: [2, 3] },
  },
})
