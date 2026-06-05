import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("unmute")
  .setDescription("Remove timeout (unmute) from a member")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("The user to unmute").setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember("user") as GuildMember | null;

  if (!target) {
    await interaction.reply({ content: "❌ User not found.", ephemeral: true });
    return;
  }

  if (!target.isCommunicationDisabled()) {
    await interaction.reply({
      content: "❌ This user is not currently muted.",
      ephemeral: true,
    });
    return;
  }

  await target.timeout(null);
  await interaction.reply(`🔊 **${target.user.tag}** has been unmuted.`);
}
