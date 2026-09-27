import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { fetchDiscordBotApi } from '@/lib/discord-api';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guildId = req.nextUrl.searchParams.get('guildId');
    if (!guildId) {
      return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
    }

    // Attempt to fetch the specific guild using the bot token
    const res = await fetchDiscordBotApi(`/guilds/${guildId}`);

    // If the bot is not in the guild, Discord typically returns 403 (Forbidden) or 404 (Not Found)
    if (!res.ok) {
      if (res.status === 403 || res.status === 404) {
        return NextResponse.json({ inGuild: false, clientId: process.env.DISCORD_CLIENT_ID });
      }
      const errorText = await res.text();
      return NextResponse.json({ error: `Discord API error: ${res.status} ${errorText}` }, { status: 500 });
    }

    return NextResponse.json({ inGuild: true, clientId: process.env.DISCORD_CLIENT_ID });
  } catch (error) {
    console.error('Error fetching bot guild status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
