import { Interaction, ChatInputCommandInteraction } from "discord.js";
import { commands } from "../registry.js";
import { logger } from "../../lib/logger.js";

export async function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commands.get(interaction.commandName);
  if (!cmd) {
    logger.warn({ command: interaction.commandName }, "Unknown command received");
    await interaction.reply({ content: "❌ Komut bulunamadı.", ephemeral: true });
    return;
  }

  try {
    await cmd.execute(interaction as ChatInputCommandInteraction);
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, "Command execution failed");
    const errorMsg = "❌ Bu komut çalıştırılırken bir hata oluştu.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
}
