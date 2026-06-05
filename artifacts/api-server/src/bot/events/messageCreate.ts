import { Message } from "discord.js";
import OpenAI from "openai";
import { AI_PREFIX } from "../config.js";
import { logger } from "../../lib/logger.js";

const GROQ_API_KEY = process.env["GROQ_API_KEY"];

let groqClient: OpenAI | null = null;

function getGroq(): OpenAI | null {
  if (!GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return groqClient;
}

export async function handleMessageCreate(message: Message) {
  if (message.author.bot) return;

  const botMentioned = message.mentions.has(message.client.user!);
  const hasPrefix = message.content.toLowerCase().startsWith(AI_PREFIX);

  if (!botMentioned && !hasPrefix) return;

  const groq = getGroq();
  if (!groq) {
    await message.reply("❌ AI özelliği şu an kullanılamıyor. (GROQ_API_KEY eksik)");
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

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Groq request failed");
    await message.reply(`❌ AI hatası: ${errorMessage.slice(0, 200)}`);
  }
}
