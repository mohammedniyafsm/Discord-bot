import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { fetchDiscordBotApi } from '@/lib/discord-api';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const ownerId = session.user.id;
    const body = await request.json();
    const { guildId, guildName, notifyChannelId, mirrorChannelId } = body;

    if (!guildId || !guildName || !notifyChannelId || !mirrorChannelId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify the bot is in this guild securely
    const guildRes = await fetchDiscordBotApi(`/guilds/${guildId}`);

    if (!guildRes.ok) {
      if (guildRes.status === 403 || guildRes.status === 404) {
        return NextResponse.json({ error: 'Bot is not in this guild. Please invite the bot first.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to verify bot guild status' }, { status: 500 });
    }

    // 2. Create the webhook in the mirror channel
    const webhookRes = await fetchDiscordBotApi(`/channels/${mirrorChannelId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Mirror Notifications',
      }),
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text();
      return NextResponse.json({ error: `Failed to create webhook: ${webhookRes.status} ${errorText}` }, { status: 500 });
    }

    const webhookData = await webhookRes.json();
    const mirrorWebhookUrl = webhookData.url || `https://discord.com/api/webhooks/${webhookData.id}/${webhookData.token}`;

    // 3. Upsert the Server row in the database
    const server = await prisma.server.upsert({
      where: { guildId },
      update: {
        guildName,
        notifyChannelId,
        mirrorWebhookUrl,
        ownerId,
        isActive: true,
      },
      create: {
        guildId,
        guildName,
        notifyChannelId,
        mirrorWebhookUrl,
        ownerId,
      },
    });

    return NextResponse.json({
      id: server.id,
      guildId: server.guildId,
      guildName: server.guildName,
      notifyChannelId: server.notifyChannelId,
      isActive: server.isActive,
    });
  } catch (error) {
    console.error('Error creating server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json({ error: 'Missing guildId parameter' }, { status: 400 });
    }

    // @ts-ignore
    const ownerId = session.user.id;

    // 1. Tell Discord to make the bot leave the server
    try {
      let response = await fetchDiscordBotApi(`/users/@me/guilds/${guildId}`, {
        method: 'DELETE',
      });
      console.log("Response from discord after delete bot from the server", response)
    } catch (e) {
      console.warn(`Failed to leave Discord guild ${guildId} (might already be kicked):`, e);
    }

    // 2. Verify ownership and delete from our database
    await prisma.server.deleteMany({
      where: {
        guildId,
        ownerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting server:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json({ error: 'Missing guildId parameter' }, { status: 400 });
    }

    const server = await prisma.server.findUnique({
      where: { guildId },
      select: { notifyChannelId: true, guildName: true }
    });

    if (!server) {
      return NextResponse.json({ error: 'Server config not found' }, { status: 404 });
    }

    return NextResponse.json(server);
  } catch (error) {
    console.error('Error fetching server config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
