import nacl from "tweetnacl";
import { prisma } from "@/lib/prisma";

type InteractionBody = {
  id?: string;
  type?: number;
  data?: {
    name?: string;
    options?: Array<{ name?: string; value?: unknown }>;
  };
  member?: { user?: { id?: string; username?: string } };
  user?: { id?: string; username?: string };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!verifyDiscordSignature(rawBody, signature, timestamp)) {
    return new Response(null, { status: 401 });
  }


  let body: InteractionBody;
  try {
    body = JSON.parse(rawBody) as InteractionBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (body.type === 1) {
    return Response.json({ type: 1 });
  }

  if (body.type !== 2 || !body.id) {
    return Response.json({ type: 4, data: { content: "Unknown command." } });
  }

  const commandName = body.data?.name ?? "unknown";
  const userId = body.member?.user?.id ?? body.user?.id ?? "unknown";
  const username =
    body.member?.user?.username ?? body.user?.username ?? "unknown";

  try {
    const existingLog = await prisma.interactionLog.findUnique({
      where: { discordInteractionId: body.id },
    });

    if (existingLog) {
      return Response.json({
        type: 4,
        data: { content: "Already processed." },
      });
    }

    if (commandName !== "status" && commandName !== "report") {
      return Response.json({
        type: 4,
        data: { content: "Unknown command." },
      });
    }

    const config = await prisma.commandConfig.findUnique({
      where: { commandName },
    });
    const inputText =
      commandName === "report"
        ? body.data?.options?.find((option) => option.name === "text")?.value
        : null;
    const reportText = typeof inputText === "string" ? inputText : "";
    const responseText =
      config?.enabled === false
        ? "This command is currently disabled."
        : config?.replyMessage ||
        (commandName === "status"
          ? "✅ Bot is online and healthy."
          : `✅ Report logged: ${reportText}`);

    const interactionLog = await prisma.interactionLog.create({
      data: {
        discordInteractionId: body.id,
        commandName,
        userId,
        username,
        inputText: commandName === "report" ? reportText : null,
        responseSent: responseText,
        status: "success",
      },
    });

    if (commandName === "report" && config?.enabled !== false) {
      try {
        const webhookUrl = process.env.MIRROR_WEBHOOK_URL;
        if (!webhookUrl) {
          throw new Error("MIRROR_WEBHOOK_URL is not configured");
        }

        const mirrorResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `Report from ${username}: ${reportText}`,
          }),
        });

        if (!mirrorResponse.ok) {
          throw new Error(
            `Webhook returned ${mirrorResponse.status} ${mirrorResponse.statusText}`,
          );
        }

        await prisma.interactionLog.update({
          where: { id: interactionLog.id },
          data: { mirrored: true },
        });
      } catch (mirrorError) {
        const errorMessage = getErrorMessage(mirrorError);
        console.error("Failed to mirror Discord report", {
          interactionId: body.id,
          commandName,
          error: mirrorError,
        });

        try {
          await prisma.interactionLog.update({
            where: { id: interactionLog.id },
            data: { mirrored: false, errorMessage },
          });
        } catch (updateError) {
          console.error("Failed to record report mirror failure", {
            interactionId: body.id,
            commandName,
            error: updateError,
          });
        }
      }
    }

    return Response.json({ type: 4, data: { content: responseText } });
  } catch (error) {
    console.error("Failed to process Discord interaction", {
      interactionId: body.id,
      commandName,
      error,
    });
    return Response.json({
      type: 4,
      data: { content: "Something went wrong, please try again." },
    });
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function verifyDiscordSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  if (!signature || !timestamp) {
    return false;
  }

  try {
    const publicKey = hexToUint8Array(process.env.DISCORD_PUBLIC_KEY ?? "");
    const signatureBytes = hexToUint8Array(signature);
    const signedMessage = new TextEncoder().encode(timestamp + rawBody);

    return nacl.sign.detached.verify(
      signedMessage,
      signatureBytes,
      publicKey,
    );
  } catch {
    return false;
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  if (!/^(?:[0-9a-fA-F]{2})+$/.test(hex)) {
    throw new Error("Expected an even-length hexadecimal string");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}