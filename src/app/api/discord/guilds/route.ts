import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore 
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      // @ts-ignore
      where: { id: session.user.id },
      include: { accounts: true },
    });


    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const discordAccount = user.accounts.find(a => a.provider === 'discord');
    if (!discordAccount?.access_token) {
      return NextResponse.json({ error: 'Discord access token not found' }, { status: 500 });
    }

    const res = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${discordAccount.access_token}`,
      },
    });



    if (res.status === 401) {
      return NextResponse.json({ error: 'Discord session expired, please log in again' }, { status: 401 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch guilds from Discord' }, { status: 500 });
    }

    const guilds = await res.json();

    const MANAGE_GUILD = BigInt(0x20);
    const managedGuilds = guilds.filter((g: { id: string, name: string, icon: string, permissions: string }) => (BigInt(g.permissions) & MANAGE_GUILD) !== BigInt(0));
    const result = await Promise.all(
      managedGuilds.map(async (guild: { id: string, name: string, icon: string, permissions: string }) => {
        // @ts-ignore 
        const existingServer = await prisma.server?.findUnique({
          where: { guildId: guild.id },
        }).catch(() => null);

        return {
          ...guild,
          connected: !!existingServer && existingServer.isActive,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
