import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("mute")
  .setDescription("Timeout (mute) a member")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("The user to mute").setRequired(true),
  )
  .addIntegerOption((opt) =>
    opt
      .setName("minutes")
      .setDescription("Duration in minutes (default: 10)")
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(40320),
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for the mute").setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember("user") as GuildMember | null;
  const minutes = interaction.options.getInteger("minutes") ?? 10;
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (!target) {
    await interaction.reply({ content: "❌ User not found.", ephemeral: true });
    return;
  }

  if (!target.moderatable) {
    await interaction.reply({
      content: "❌ I cannot mute this user. They may have a higher role than me.",
      ephemeral: true,
    });
    return;
  }

  const duration = minutes * 60 * 1000;
  await target.timeout(duration, reason);
  await interaction.reply(
    `🔇 **${target.user.tag}** has been muted for **${minutes} minute(s)**. Reason: ${reason}`,
  );
}
