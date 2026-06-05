import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kick a member from the server")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("The user to kick").setRequired(true),
  )
  .addStringOption((opt) =>
    opt.setName("reason").setDescription("Reason for the kick").setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getMember("user") as GuildMember | null;
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (!target) {
    await interaction.reply({ content: "❌ User not found.", ephemeral: true });
    return;
  }

  if (!target.kickable) {
    await interaction.reply({
      content: "❌ I cannot kick this user. They may have a higher role than me.",
      ephemeral: true,
    });
    return;
  }

  await target.kick(reason);
  await interaction.reply(`👢 **${target.user.tag}** has been kicked. Reason: ${reason}`);
}
