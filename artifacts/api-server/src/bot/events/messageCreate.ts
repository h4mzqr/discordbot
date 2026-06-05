import { Message } from "discord.js";
import OpenAI from "openai";
import { OPENAI_API_KEY, AI_PREFIX } from "../config.js";
import { logger } from "../../lib/logger.js";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!OPENAI_API_KEY) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return openaiClient;
}

export async function handleMessageCreate(message: Message) {
  if (message.author.bot) return;

  const botMentioned = message.mentions.has(message.client.user!);
  const hasPrefix = message.content.toLowerCase().startsWith(AI_PREFIX);

  if (!botMentioned && !hasPrefix) return;

  const openai = getOpenAI();
  if (!openai) {
    await message.reply("❌ AI özelliği şu an kullanılamıyor. (OPENAI_API_KEY eksik)");
    return;
  }

  let userText = message.content;
  if (hasPrefix) {
    userText = userText.slice(AI_PREFIX.length).trim();
  } else {
    userText = userText.replace(/<@!?\d+>/g, "").trim();
  }

  if (!userText) {
    await message.reply("Merhaba! Sana nasıl yardımcı olabilirim?");
    return;
  }

  try {
    if ("sendTyping" in message.channel) {
      await message.channel.sendTyping();
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful Discord bot assistant. Be concise, friendly, and helpful. You can respond in the same language the user writes in.",
        },
        { role: "user", content: userText },
      ],
    });

    const reply = response.choices[0]?.message?.content ?? "Bir yanıt oluşturulamadı.";

    if (reply.length > 2000) {
      const chunks = reply.match(/.{1,1990}/gs) ?? [];
      for (const chunk of chunks) {
        if ("send" in message.channel) {
          await message.channel.send(chunk);
        }
      }
    } else {
      await message.reply(reply);
    }
  } catch (err) {
    logger.error({ err }, "OpenAI request failed");
    await message.reply("❌ Bir hata oluştu, lütfen tekrar deneyin.");
  }
}
