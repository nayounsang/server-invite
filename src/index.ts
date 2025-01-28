import dotenv from "dotenv";
import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// 디스코드 유저 설정 -> 고급 -> 개발자 모드 활성화 -> 필요한 서버, 채널 우클릭
const GUILD_ID = process.env.GUILD_ID as string;
// const CHANNEL_ID = process.env.CHANNEL_ID as string;

const PORT = process.env.PORT as string;

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.login(DISCORD_TOKEN);

app.get("/", async (req: Request, res: Response) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = guild?.channels?.cache?.find(
      (ch) => ch.type === ChannelType.GuildText
    );

    if (!channel) {
      res.status(404).send("Channel not found.");
      return;
    }

    const invite = await channel.createInvite({
      maxAge: 0, // 초대 만료 시간 (0이면 만료되지 않음)
      maxUses: 10, // 100 이하
      unique: true,
    });

    const url = invite.url;
    if (!url) {
      res.status(404).send("Invite url is not created.");
    }

    res.redirect(url);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating invite.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
