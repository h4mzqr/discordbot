import { GuildMember } from "discord.js";
import { AUTOROLE_ROLE_ID } from "../config.js";
import { logger } from "../../lib/logger.js";

export async function handleGuildMemberAdd(member: GuildMember) {
  if (!AUTOROLE_ROLE_ID) {
    logger.warn("AUTOROLE_ROLE_ID is not set — skipping auto-role");
    return;
  }

  const role = member.guild.roles.cache.get(AUTOROLE_ROLE_ID);
  if (!role) {
    logger.warn({ roleId: AUTOROLE_ROLE_ID }, "Auto-role not found in guild");
    return;
  }

  try {
    await member.roles.add(role);
    logger.info({ userId: member.id, roleId: AUTOROLE_ROLE_ID }, "Auto-role assigned");
  } catch (err) {
    logger.error({ err, userId: member.id }, "Failed to assign auto-role");
  }
}
