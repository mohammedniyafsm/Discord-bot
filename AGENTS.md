<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Discord Bot Project AI Rules

When assisting with this project, always adhere to the following architectural constraints and conventions:

## 1. Security & Secrets
- **NEVER** expose `DISCORD_BOT_TOKEN`, `NEXTAUTH_SECRET`, or `DISCORD_PUBLIC_KEY` in client-side components (anything in `src/components/` or files with `"use client"`).
- All interactions with the Discord API using the Bot Token must occur strictly on the server (e.g., inside `src/app/api/`).

## 2. API Communication
- Always use the custom helper `fetchDiscordBotApi()` located in `src/lib/discord-api.ts` when making requests to Discord. This ensures the correct authorization headers are always attached.
- When querying Discord for bot membership, always query a specific guild (`/guilds/{guildId}`) rather than iterating over all bot guilds, to preserve privacy and performance.

## 3. Database Constraints (Prisma)
- Always check if a `Server` or `CommandConfig` actually exists before attempting to read properties like `mirrorWebhookUrl`.
- Interactions must be deduplicated. Always use `discordInteractionId` as a unique identifier to gracefully reject duplicate requests from Discord.

## 4. UI/UX
- Use modern, dark-mode focused aesthetics (glassmorphism, subtle borders) matching the existing `account.module.css` and CSS module designs.
- Do not use TailwindCSS; rely on standard CSS Modules as currently implemented in the codebase.
