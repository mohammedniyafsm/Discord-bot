import nacl from "tweetnacl";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) {
    return new Response(null, { status: 401 });
  }

  try {
    const publicKey = hexToUint8Array(process.env.DISCORD_PUBLIC_KEY ?? "");
    const signatureBytes = hexToUint8Array(signature);

    const signedMessage = new TextEncoder().encode(timestamp + rawBody);
    const isValid = nacl.sign.detached.verify(
      signedMessage,
      signatureBytes,
      publicKey,
    );

    if (!isValid) {
      return new Response(null, { status: 401 });
    }
  } catch {
    return new Response(null, { status: 401 });
  }

  let body: { type?: number };
  try {
    body = JSON.parse(rawBody) as { type?: number };
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (body.type === 1) {
    return Response.json({ type: 1 });
  }

  return Response.json({
    type: 4,
    data: { content: "Phase 1 stub — not yet implemented" },
  });
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