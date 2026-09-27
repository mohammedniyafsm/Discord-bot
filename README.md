# Discord Slash-Command Bot & Dashboard

A full-stack Next.js web application and Discord bot that processes slash commands, securely verifies interactions via Ed25519 signatures, mirrors reports to hidden channels, and provides a multi-tenant dashboard for server admins.

## Features

- **Serverless Discord Bot:** Powered by a Next.js API route (`/api/interactions`) instead of an always-on websocket, meaning it costs $0 to host and scales infinitely.
- **Secure Ed25519 Verification:** Implements raw-body cryptographic signature verification using `tweetnacl` to reject unauthorized requests.
- **Multi-Tenant Architecture:** Admins can sign in via Discord OAuth and manage settings specifically for the servers they own (`MANAGE_GUILD` permissions).
- **Live Observability Dashboard:** View real-time logs of every command executed in your server, including status, user info, and whether the webhook mirror succeeded.
- **Dynamic Command Configuration:** Toggle commands on/off per server, or inject dynamic responses using the `{text}` variable.
- **Automated Webhook Provisioning:** The app automatically provisions a hidden Discord webhook when connecting a server to mirror reports.

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Neon (Serverless PostgreSQL)
- **ORM:** Prisma
- **Auth:** NextAuth (Discord Provider)
- **Styling:** CSS Modules & Lucide React Icons

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- A Discord Developer Application (Bot)
- A PostgreSQL Database (Neon recommended)

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"

# Discord OAuth (for the NextAuth Dashboard Login)
DISCORD_CLIENT_ID="your_oauth_client_id"
DISCORD_CLIENT_SECRET="your_oauth_client_secret"

# Discord Bot Credentials
DISCORD_BOT_TOKEN="your_bot_token"
DISCORD_PUBLIC_KEY="your_bot_public_key"
```

### 3. Install & Initialize
Install dependencies:
```bash
npm install
```

Push the database schema to your PostgreSQL database:
```bash
npx prisma db push
```

### 4. Register Slash Commands
Run the provided script to register the `/report` and `/status` global slash commands with Discord. (Note: Global commands can take up to an hour to propagate in Discord, though they are usually faster).
```bash
npx tsx scripts/register-commands.ts
```

### 5. Start the Development Server
Because Discord needs a publicly reachable URL for the Interactions Endpoint, you must use a tunneling service like **ngrok** during local development.

Start the Next.js app:
```bash
npm run dev
```

In a new terminal, start ngrok:
```bash
ngrok http 3000
```

### 6. Configure Discord
1. Go to the Discord Developer Portal.
2. In your application's **General Information**, set the **Interactions Endpoint URL** to your ngrok URL: `https://<your-ngrok-id>.ngrok-free.app/api/interactions`
3. In **OAuth2 > Redirects**, add your ngrok URL: `https://<your-ngrok-id>.ngrok-free.app/api/auth/callback/discord`
4. Save changes. Discord will instantly send a PING to your endpoint to verify it works.

---

## How to Test This Submission (For Reviewers)

To test the application end-to-end, you can use the following credentials and invite links:

**1. Live Application URL:**
[Insert Vercel URL Here]

**2. Test Discord Server Invite:**
[Insert Invite Link to your Test Server Here]
*(Alternatively, you can invite the bot to your own server using this [Invite Link])*

**3. Throwaway Admin Account:**
Since the dashboard requires Discord OAuth login, please log in with your own Discord account. I have ensured the bot has the correct OAuth scopes. Once logged in, you will only see servers where you have `MANAGE_GUILD` permissions. 
*(If you need a specific throwaway discord account credential, insert it here: Email / Password)*

---

## Deployment (Vercel)

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Add all the Environment Variables listed above to your Vercel project settings.
4. Set `NEXTAUTH_URL` to your production Vercel URL.
5. Deploy!
6. Remember to update your **Interactions Endpoint URL** and **OAuth2 Redirects** in the Discord Developer Portal to point to your new live Vercel URL instead of localhost/ngrok.