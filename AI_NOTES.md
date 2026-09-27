# AI Notes

## Tools and Workflow
I used the **Antigravity IDE (Gemini 3.1 Pro)** as a pair-programming assistant throughout this project. 
The work was split collaboratively: I drove the high-level architecture (Next.js App Router, Prisma), the database schema design, and the overall user experience flow. I relied on the AI to generate boilerplate code, build the React UI components, and write the complex `tweetnacl` cryptography logic for verifying the Ed25519 signatures. I acted as the reviewer, catching edge cases and directing the AI to refactor code when it made poor architectural choices.

## Key Decisions
1. **Architecture (Next.js App Router):** I chose to keep both the frontend dashboard and the Discord `/api/interactions` endpoint in a single Next.js application. This simplifies deployment to a single Vercel instance and allows both the UI and the bot to seamlessly share the Prisma client and database connection without needing a separate microservice.
2. **Database Schema & Deduplication:** I chose Prisma with a PostgreSQL database. For the `InteractionLog` model, I explicitly made `discordInteractionId` a unique constraint. This guarantees that if Discord retries a request, the database will inherently reject the duplicate, satisfying the strict deduplication requirement effortlessly.
3. **Mirroring via Webhooks:** Rather than having the bot manually post messages into the mirror channel, I chose to generate a Discord Webhook URL for the target channel and save it to the database. This makes the mirroring process isolated, faster, and less reliant on complex bot permissions in the destination channel.

## The Hardest Bug / Wrong Turn from AI
The most significant mistake the AI made was in the logic used to verify if the bot had been added to a user's server. 
Initially, the AI generated an endpoint (`/api/discord/bot-guilds`) that called Discord's `/users/@me/guilds` to fetch an array of **every single server** the bot was installed in. It then sent this entire array to the frontend just so the client could check `array.includes(currentGuildId)`.

**How I noticed:** While reviewing the network requests in the dashboard, I realized the API was returning an array of server IDs. I realized that if the bot scaled to 10,000 servers, this would cause massive pagination performance issues and leak the private server IDs of every other user's Discord servers to the client browser.

**How I fixed it:** I instructed the AI to completely scrap that approach. Instead, I had the frontend pass the `guildId` as a query parameter (`?guildId=123`), and refactored the backend to check the specific guild using `fetchDiscordBotApi('/guilds/{guildId}')`. This changed the response to a simple `{ inGuild: true/false }`, closing the privacy leak and making it instantly scalable.

## Future Improvements
If I had more time, I would:
1. **Implement Background Processing:** Currently, the `/api/interactions` endpoint does database lookups and hits the mirror webhook synchronously before responding to Discord. While fast enough now, I would offload the mirror webhook to a background queue (like Upstash/QStash) to guarantee we never hit Discord's 3-second timeout limit.
2. **AI Summarization (Stretch Goal):** I would integrate the Gemini API to briefly summarize or categorize `/report` texts before sending them to the mirror channel.
3. **More Interactive UI:** I would add Discord UI components (like action buttons) inside the mirror channel so admins can click "Resolve Report" directly from Discord, which would update the database status.
