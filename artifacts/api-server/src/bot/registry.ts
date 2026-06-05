import { ChatInputCommandInteraction } from "discord.js";
import * as ban from "./commands/ban.js";
import * as kick from "./commands/kick.js";
import * as mute from "./commands/mute.js";
import * as unmute from "./commands/unmute.js";
import * as help from "./commands/help.js";

type Command = {
  data: { name: string; toJSON: () => object };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

export const commands = new Map<string, Command>();

const allCommands: Command[] = [ban, kick, mute, unmute, help];

for (const cmd of allCommands) {
  commands.set(cmd.data.name, cmd);
}
