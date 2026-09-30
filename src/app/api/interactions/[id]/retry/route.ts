import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;

    const interactionLog = await prisma.interactionLog.findUnique({
      where: { id },
    });

    if (!interactionLog) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    if (interactionLog.mirrored) {
      return NextResponse.json({ error: 'Log is already mirrored successfully' }, { status: 400 });
    }

    if (interactionLog.commandName !== 'report') {
      return NextResponse.json({ error: 'Only report commands can be mirrored' }, { status: 400 });
    }

    if (!interactionLog.guildId) {
      return NextResponse.json({ error: 'No guild associated with this log' }, { status: 400 });
    }

    const serverConfig = await prisma.server.findUnique({
      where: { guildId: interactionLog.guildId }
    });

    if (!serverConfig) {
      return NextResponse.json({ error: 'Server configuration not found' }, { status: 404 });
    }

    if (serverConfig.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const webhookUrl = serverConfig.mirrorWebhookUrl;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is not configured' }, { status: 400 });
    }

    try {
      const mirrorResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Report from ${interactionLog.username}: ${interactionLog.inputText || ''}`,
        }),
      });

      if (!mirrorResponse.ok) {
        throw new Error(
          `Webhook returned ${mirrorResponse.status} ${mirrorResponse.statusText}`,
        );
      }

      const updatedLog = await prisma.interactionLog.update({
        where: { id: interactionLog.id },
        data: { mirrored: true, errorMessage: null },
      });

      return NextResponse.json(updatedLog);
    } catch (mirrorError) {
      const errorMessage = mirrorError instanceof Error ? mirrorError.message : String(mirrorError);

      const updatedLog = await prisma.interactionLog.update({
        where: { id: interactionLog.id },
        data: { mirrored: false, errorMessage },
      });

      return NextResponse.json(updatedLog, { status: 500 });
    }

  } catch (error) {
    console.error('Failed to retry interaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
