import { Client, GatewayIntentBits, Partials } from "discord.js";
import { BOT_TOKEN } from "./config.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";
import { deployCommands } from "./deploy-commands.js";
import { logger } from "../lib/logger.js";

export function startBot() {
  if (!BOT_TOKEN) {
    logger.warn("DISCORD_BOT_TOKEN is not set — Discord bot will not start");
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.GuildMember],
  });

  client.once("ready", async (c) => {
    logger.info({ tag: c.user.tag }, "Discord bot is online");
    await deployCommands();
  });

  client.on("guildMemberAdd", handleGuildMemberAdd);
  client.on("messageCreate", handleMessageCreate);
  client.on("interactionCreate", handleInteractionCreate);

  client.on("error", (err) => {
    logger.error({ err }, "Discord client error");
  });

  client.login(BOT_TOKEN).catch((err) => {
    logger.error({ err }, "Failed to login to Discord");
  });
}
