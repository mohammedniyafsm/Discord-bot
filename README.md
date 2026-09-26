# Discord Interactions Bot

This project is a Discord slash-command bot with a Next.js admin dashboard planned for a later phase. It exposes a Vercel-compatible Discord interactions endpoint that verifies Ed25519 signatures, handles PING validation, persists command interactions in Neon Postgres through Prisma, and mirrors reports to a webhook.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a local `.env.local` file:

```env
DISCORD_PUBLIC_KEY=your_discord_application_public_key
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_discord_application_id
DISCORD_CLIENT_ID=your_discord_oauth_client_id
DISCORD_CLIENT_SECRET=your_discord_oauth_client_secret
NEXTAUTH_SECRET=generate_a_long_random_secret
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your_neon_connection_string
MIRROR_WEBHOOK_URL=your_discord_or_slack_webhook_url
```

`DISCORD_PUBLIC_KEY` is required for signature verification. Get it from **Discord Developer Portal > Your Application > General Information > Public Key**. Keep these values server-side; do not prefix them with `NEXT_PUBLIC_`.

For Discord login, add `http://localhost:3000/api/auth/callback/discord` to the application's OAuth2 redirect URLs. Set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` from the Discord Developer Portal, and set `NEXTAUTH_SECRET` to a long random value. `NEXTAUTH_URL` should match the site's base URL.

`DATABASE_URL` is the Postgres connection string from the Neon dashboard. Neon connection strings already include `?sslmode=require`, which Prisma needs. `MIRROR_WEBHOOK_URL` can be a Discord channel webhook or a Slack Incoming Webhook; this project sends the mirror request in Discord's webhook format (`{"content":"..."}`).

After adding your Neon connection string, create the database tables locally with:

```bash
npx prisma migrate dev --name init
```

Run the same migration command against a Neon database by putting its `DATABASE_URL` in `.env.local` first.

3. Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 to view the minimal homepage.

## Discord endpoint

Configure Discord's interactions endpoint URL as:

```text
https://your-vercel-domain.vercel.app/api/interactions
```

The endpoint accepts POST requests, verifies `X-Signature-Ed25519` and `X-Signature-Timestamp` against the raw request body, returns `{ "type": 1 }` for PING requests, and handles the `status` and `report` commands with database persistence, duplicate protection, configurable replies, and report mirroring.

## Vercel environment variable

In the Vercel project settings, add `DISCORD_PUBLIC_KEY`, `DATABASE_URL`, and `MIRROR_WEBHOOK_URL`. `DISCORD_PUBLIC_KEY` must be named exactly that and must **not** be prefixed with `NEXT_PUBLIC_`, because these values are read only on the server. Run `npx prisma migrate deploy` during deployment or from an environment with the production Neon `DATABASE_URL`.

## Register slash commands once

The one-off registration script loads `DISCORD_BOT_TOKEN` and `DISCORD_APPLICATION_ID` from `.env.local` and replaces the application's global commands with `status` and `report`:

```bash
node scripts/register-commands.js
```

It logs Discord's HTTP status and response body. Run it again only when you intentionally want to update the registered command definitions.