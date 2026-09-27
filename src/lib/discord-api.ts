export async function fetchDiscordBotApi(endpoint: string, options: RequestInit = {}) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    throw new Error('DISCORD_BOT_TOKEN is not configured');
  }

  const url = endpoint.startsWith('http') ? endpoint : `https://discord.com/api${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
