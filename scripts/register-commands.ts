import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const botToken = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!botToken || !applicationId) {
  console.error(
    "Missing DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID in .env.local",
  );
  throw new Error("Missing required Discord environment variables");
}

const requiredBotToken = botToken;
const requiredApplicationId = applicationId;

const commands = [
  {
    name: "status",
    description: "Check bot status",
  },
  {
    name: "report",
    description: "Submit a report",
    options: [
      {
        name: "text",
        description: "What are you reporting?",
        type: 3,
        required: true,
      },
    ],
  },
];

async function registerCommands() {
  const url = `https://discord.com/api/v10/applications/${encodeURIComponent(requiredApplicationId)}/commands`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${requiredBotToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  const responseBody = await response.text();
  console.log(`Discord response: ${response.status} ${response.statusText}`);
  console.log(responseBody);
}

registerCommands().catch((error) => {
  console.error("Failed to register Discord commands:", error);
  process.exitCode = 1;
});