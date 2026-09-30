import nacl from "tweetnacl";
import { prisma } from "@/lib/prisma";

type InteractionBody = {
  id?: string;
  type?: number;
  guild_id?: string;
  data?: {
    name?: string;
    options?: Array<{ name?: string; value?: unknown }>;
  };
  member?: { user?: { id?: string; username?: string } };
  user?: { id?: string; username?: string };
};

export async function POST(request: Request) {
  // Discord requires verifying the raw body string against the Ed25519 signature before parsing it.
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

  // Type 1 is a PING from Discord to verify the endpoint is alive
  if (body.type === 1) {
    return Response.json({ type: 1 });
  }

  // Type 2 is a SLASH COMMAND interaction
  if (body.type !== 2 || !body.id) {
    return Response.json({ type: 4, data: { content: "Unknown command." } });
  }

  const commandName = body.data?.name ?? "unknown";
  const userId = body.member?.user?.id ?? body.user?.id ?? "unknown";
  const username =
    body.member?.user?.username ?? body.user?.username ?? "unknown";

  try {
    // Discord may retry failed/slow requests. We must dedup by ID to avoid double-processing.
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

    const config = body.guild_id ? await prisma.commandConfig.findUnique({
      where: {
        guildId_commandName: {
          guildId: body.guild_id,
          commandName,
        }
      },
    }) : null;
    const inputText =
      commandName === "report"
        ? body.data?.options?.find((option) => option.name === "text")?.value
        : null;
    const reportText = typeof inputText === "string" ? inputText : "";

    let responseText = "";
    let logStatus = "success";

    if (config?.enabled === false) {
      responseText = "This command is currently disabled.";
      logStatus = "disabled";
    } else {
      if (commandName === "status") {
        responseText = config?.replyMessage || "✅ Bot is online and healthy.";
      } else if (commandName === "report") {
        if (config?.replyMessage) {
          if (config.replyMessage.includes("{text}")) {
            responseText = config.replyMessage.replace("{text}", reportText);
          } else {
            responseText = `${config.replyMessage} ${reportText}`.trim();
          }
        } else {
          responseText = `✅ Report logged: ${reportText}`.trim();
        }
      } else {
        responseText = config?.replyMessage || "Command executed.";
      }
    }

    const interactionLog = await prisma.interactionLog.create({
      data: {
        id: crypto.randomUUID(),
        discordInteractionId: body.id,
        commandName,
        guildId: body.guild_id,
        userId,
        username,
        inputText: commandName === "report" ? reportText : null,
        responseSent: responseText,
        status: logStatus,
      },
    });

    if (commandName === "report" && config?.enabled !== false) {
      try {
        if (!body.guild_id) {
          throw new Error("Interaction missing guild_id");
        }

        const serverConfig = await prisma.server.findUnique({
          where: { guildId: body.guild_id }
        });

        // const webhookUrl = serverConfig?.mirrorWebhookUrl;
        const webhookUrl = "https://console.neon.tech/app/projects/red-darkness-45566311/branches/br-bold-hill-b3zhe6hp/tables";
        if (!webhookUrl) {
          throw new Error("MIRROR_WEBHOOK_URL is not configured for this server");
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