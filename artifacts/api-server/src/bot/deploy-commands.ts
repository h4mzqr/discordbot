import { REST, Routes } from "discord.js";
import { CLIENT_ID, BOT_TOKEN, GUILD_ID } from "./config.js";
import { commands } from "./registry.js";
import { logger } from "../lib/logger.js";

export async function deployCommands() {
  if (!BOT_TOKEN || !CLIENT_ID) {
    logger.error("DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID are required to deploy commands");
    return;
  }

  const body = [...commands.values()].map((cmd) => cmd.data.toJSON());
  const rest = new REST().setToken(BOT_TOKEN);

  try {
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
      logger.info({ guildId: GUILD_ID, count: body.length }, "Guild slash commands registered");
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
      logger.info({ count: body.length }, "Global slash commands registered");
    }
  } catch (err) {
    logger.error({ err }, "Failed to deploy slash commands");
  }
}
