import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all available bot commands");

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📖 Bot Commands")
    .setDescription("Here are all available commands:")
    .addFields(
      {
        name: "🤖 AI Chat",
        value: "Mention the bot or use `!ai <message>` to chat with AI",
      },
      {
        name: "🔨 /ban <user> [reason]",
        value: "Ban a member from the server",
      },
      {
        name: "👢 /kick <user> [reason]",
        value: "Kick a member from the server",
      },
      {
        name: "🔇 /mute <user> [minutes] [reason]",
        value: "Timeout (mute) a member",
      },
      {
        name: "🔊 /unmute <user>",
        value: "Remove timeout from a member",
      },
      {
        name: "❓ /help",
        value: "Show this help message",
      },
    )
    .setFooter({ text: "Auto-role is enabled for new members" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
