// Discord Bot - Termux için tek dosya
// Kurulum: npm install discord.js openai
// Çalıştır: node bot.js

import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import OpenAI from "openai";

// ── Ayarlar ────────────────────────────────────────────────
const BOT_TOKEN       = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID       = process.env.DISCORD_CLIENT_ID;
const GUILD_ID        = process.env.DISCORD_GUILD_ID;
const AUTOROLE_ID     = process.env.AUTOROLE_ROLE_ID;
const GROQ_API_KEY    = process.env.GROQ_API_KEY;
// ────────────────────────────────────────────────────────────

if (!BOT_TOKEN || !CLIENT_ID) {
  console.error("❌ DISCORD_BOT_TOKEN ve DISCORD_CLIENT_ID gerekli!");
  process.exit(1);
}

// Groq (AI) istemcisi
const groq = GROQ_API_KEY
  ? new OpenAI({ apiKey: GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" })
  : null;

// Slash komutları
const commands = [
  new SlashCommandBuilder()
    .setName("ban").setDescription("Bir üyeyi yasakla")
    .addUserOption(o => o.setName("user").setDescription("Kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Sebep"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("kick").setDescription("Bir üyeyi at")
    .addUserOption(o => o.setName("user").setDescription("Kullanıcı").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Sebep"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("mute").setDescription("Bir üyeyi sustur")
    .addUserOption(o => o.setName("user").setDescription("Kullanıcı").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Dakika (varsayılan: 10)").setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName("reason").setDescription("Sebep"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("unmute").setDescription("Susturmayı kaldır")
    .addUserOption(o => o.setName("user").setDescription("Kullanıcı").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("help").setDescription("Tüm komutları göster"),
];

// Komutları kaydet
async function deployCommands() {
  const rest = new REST().setToken(BOT_TOKEN);
  const body = commands.map(c => c.toJSON());
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
    console.log(`✅ ${body.length} komut sunucuya kaydedildi (anında aktif)`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
    console.log(`✅ ${body.length} komut global kaydedildi (1 saate kadar sürebilir)`);
  }
}

// Bot istemcisi
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

// Hazır
client.once("ready", async (c) => {
  console.log(`🤖 Bot online: ${c.user.tag}`);
  await deployCommands();
});

// Yeni üye → auto-rol
client.on("guildMemberAdd", async (member) => {
  if (!AUTOROLE_ID) return;
  const role = member.guild.roles.cache.get(AUTOROLE_ID);
  if (!role) return console.warn("⚠️ Auto-rol bulunamadı:", AUTOROLE_ID);
  await member.roles.add(role).catch(console.error);
  console.log(`✅ Auto-rol verildi: ${member.user.tag}`);
});

// Mesaj → AI
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const mentioned = message.mentions.has(client.user);
  const prefixed  = message.content.toLowerCase().startsWith("!ai");
  if (!mentioned && !prefixed) return;

  if (!groq) {
    await message.reply("❌ AI aktif değil. GROQ_API_KEY eksik.");
    return;
  }

  let text = message.content;
  if (prefixed) text = text.slice(3).trim();
  else text = text.replace(/<@!?\d+>/g, "").trim();
  if (!text) { await message.reply("Merhaba! Sana nasıl yardımcı olabilirim?"); return; }

  try {
    if ("sendTyping" in message.channel) await message.channel.sendTyping();
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [
        { role: "system", content: "Yardımcı bir Discord bot asistanısın. Kullanıcının dilinde cevap ver." },
        { role: "user", content: text },
      ],
    });
    const reply = res.choices[0]?.message?.content ?? "Yanıt oluşturulamadı.";
    if (reply.length > 2000) {
      for (const chunk of reply.match(/.{1,1990}/gs) ?? []) await message.channel.send(chunk);
    } else {
      await message.reply(reply);
    }
  } catch (err) {
    await message.reply(`❌ AI hatası: ${err.message?.slice(0, 200)}`);
  }
});

// Slash komut handler
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  try {
    if (commandName === "ban") {
      const target = interaction.options.getMember("user");
      const reason = interaction.options.getString("reason") ?? "Sebep belirtilmedi";
      if (!target?.bannable) { await interaction.reply({ content: "❌ Bu kullanıcıyı banlayamam.", ephemeral: true }); return; }
      await target.ban({ reason });
      await interaction.reply(`🔨 **${target.user.tag}** banlandı. Sebep: ${reason}`);

    } else if (commandName === "kick") {
      const target = interaction.options.getMember("user");
      const reason = interaction.options.getString("reason") ?? "Sebep belirtilmedi";
      if (!target?.kickable) { await interaction.reply({ content: "❌ Bu kullanıcıyı atamam.", ephemeral: true }); return; }
      await target.kick(reason);
      await interaction.reply(`👢 **${target.user.tag}** atıldı. Sebep: ${reason}`);

    } else if (commandName === "mute") {
      const target = interaction.options.getMember("user");
      const minutes = interaction.options.getInteger("minutes") ?? 10;
      const reason = interaction.options.getString("reason") ?? "Sebep belirtilmedi";
      if (!target?.moderatable) { await interaction.reply({ content: "❌ Bu kullanıcıyı susturamam.", ephemeral: true }); return; }
      await target.timeout(minutes * 60 * 1000, reason);
      await interaction.reply(`🔇 **${target.user.tag}** ${minutes} dakika susturuldu. Sebep: ${reason}`);

    } else if (commandName === "unmute") {
      const target = interaction.options.getMember("user");
      if (!target?.isCommunicationDisabled()) { await interaction.reply({ content: "❌ Bu kullanıcı zaten susturulmamış.", ephemeral: true }); return; }
      await target.timeout(null);
      await interaction.reply(`🔊 **${target.user.tag}** susturmadan çıkarıldı.`);

    } else if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("📖 Bot Komutları")
        .addFields(
          { name: "🤖 AI Sohbet", value: "`@Bot mesaj` veya `!ai mesaj`" },
          { name: "🔨 /ban", value: "Kullanıcıyı banla" },
          { name: "👢 /kick", value: "Kullanıcıyı at" },
          { name: "🔇 /mute", value: "Kullanıcıyı sustur" },
          { name: "🔊 /unmute", value: "Susturmayı kaldır" },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  } catch (err) {
    const msg = "❌ Bir hata oluştu.";
    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: msg, ephemeral: true });
    else await interaction.reply({ content: msg, ephemeral: true });
  }
});

client.on("error", console.error);
client.login(BOT_TOKEN).catch(err => { console.error("❌ Giriş hatası:", err.message); process.exit(1); });
