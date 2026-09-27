import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });

    const configs = await prisma.commandConfig.findMany({
      where: { guildId }
    });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching command config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { guildId, commandName, enabled, replyMessage } = body;

    if (!guildId || !commandName) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const config = await prisma.commandConfig.upsert({
      where: {
        guildId_commandName: { guildId, commandName }
      },
      update: {
        enabled,
        replyMessage: replyMessage || ""
      },
      create: {
        guildId,
        commandName,
        enabled: enabled !== undefined ? enabled : true,
        replyMessage: replyMessage || ""
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating command config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
