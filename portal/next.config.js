/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Include agent-skills folder in serverless function bundles.
  // agent, evolve, and mcp routes read SKILL.md / prompt.md at runtime
  // via fs.readFile; Next.js output-tracing won't detect those dynamic paths.
  outputFileTracingIncludes: {
    '/api/ai/agent/**': ['./agent-skills/**/*.md', './agent-skills/**/manifest.json'],
    '/api/admin/evolve/**': ['./agent-skills/**/*.md', './agent-skills/**/manifest.json'],
    '/api/mcp/**': ['./agent-skills/**/*.md'],
  },
};

module.exports = nextConfig;
