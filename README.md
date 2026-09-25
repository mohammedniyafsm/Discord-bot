# Discord Interactions Bot

This project is the Phase 1 foundation for a Discord slash-command bot with a Next.js admin dashboard planned for a later phase. It currently exposes a Vercel-compatible Discord interactions endpoint that verifies Ed25519 signatures and responds to Discord's initial PING validation request.

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
```

`DISCORD_PUBLIC_KEY` is required for signature verification. Get it from **Discord Developer Portal > Your Application > General Information > Public Key**. Keep these values server-side; do not prefix them with `NEXT_PUBLIC_`.

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

The endpoint accepts POST requests, verifies `X-Signature-Ed25519` and `X-Signature-Timestamp` against the raw request body, returns `{ "type": 1 }` for PING requests, and returns a Phase 1 placeholder for other verified interaction types.

## Vercel environment variable

In the Vercel project settings, add `DISCORD_PUBLIC_KEY` with the public key from Discord. It must be named exactly `DISCORD_PUBLIC_KEY` and must **not** be prefixed with `NEXT_PUBLIC_`, because it is read only on the server.