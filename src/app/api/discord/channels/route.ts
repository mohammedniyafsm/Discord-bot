import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { fetchDiscordBotApi } from '@/lib/discord-api';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json({ error: 'Missing guildId parameter' }, { status: 400 });
    }

    // Call Discord API to get guild channels
    const res = await fetchDiscordBotApi(`/guilds/${guildId}/channels`);

    if (!res.ok) {
      if (res.status === 403 || res.status === 404) {
        return NextResponse.json({ error: 'Bot is not in this server or lacks permissions' }, { status: 400 });
      }
      const errorText = await res.text();
      return NextResponse.json({ error: `Discord API error: ${res.status} ${errorText}` }, { status: 500 });
    }

    const channels = await res.json();
    
    // Filter to text channels only (type === 0)
    const textChannels = channels
      .filter((c: { type: number, id: string, name: string }) => c.type === 0)
      .map((c: { type: number, id: string, name: string }) => ({
        id: c.id,
        name: c.name,
      }));

    return NextResponse.json(textChannels);
  } catch (error) {
    console.error('Error fetching guild channels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
