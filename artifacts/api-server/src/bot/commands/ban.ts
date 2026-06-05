import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a member from the server")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("The user to ban").setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for the ban").setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember("user") as GuildMember | null;
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (!target) {
    await interaction.reply({ content: "❌ User not found.", ephemeral: true });
    return;
  }

  if (!target.bannable) {
    await interaction.reply({
      content: "❌ I cannot ban this user. They may have a higher role than me.",
      ephemeral: true,
    });
    return;
  }

  await target.ban({ reason });
  await interaction.reply(`🔨 **${target.user.tag}** has been banned. Reason: ${reason}`);
}
