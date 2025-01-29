import dotenv from "dotenv";
import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Guild,
  TextChannel,
} from "discord.js";
import express, { Request, Response } from "express";

// CONFIG
dotenv.config();

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ENV
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// 디스코드 유저 설정 -> 고급 -> 개발자 모드 활성화 -> 필요한 서버, 채널 우클릭
const GUILD_ID = process.env.GUILD_ID as string;
// const CHANNEL_ID = process.env.CHANNEL_ID as string;
const PORT = process.env.PORT as string;

// CACHE
/**
 * - 현재, vercel serverless로 배포중
 * - 참여자가 연속적으로 (아마 무료 플랜 기준 10분?) 들어와 hot start가 발생시 유효하나, cold start에선 null임이 보장
 * - 만약 aws ec2등으로 배포하면 이 캐시가 많이 쓰일지도 모르나 솔직히 vercel로 해도 충분하다 생각(어차피 몇명씩 들어오는데...)
 * - 개인프로잭트니까 이정도 잡일(?)은 허용하자.
 */
let inMemoryCache: undefined | { inviteUrl: string; time: Date } = undefined;

// BOT
client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.login(DISCORD_TOKEN);

// SERVER
app.get("/", async (req: Request, res: Response) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      res.status(404).send("Guild not found.");
    }

    const channel = await getChannel(guild);
    if (!channel) {
      res.status(404).send("Channel not found.");
      return;
    }

    const url = await getInviteUrl(channel);
    if (!url) {
      res.status(404).send("Invite url is not created.");
    }

    res.redirect(url);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating invite.");
  }
});

const getChannel = async (guild: Guild) => {
  const cachedChannel = guild.channels?.cache?.find(
    (ch) => ch.type === ChannelType.GuildText
  );
  if (cachedChannel) {
    return cachedChannel;
  }
  return guild.channels
    .fetch()
    .then((channels) => {
      return channels.find((ch) => ch?.type === ChannelType.GuildText);
    })
    .catch((e) => {
      throw new Error(e);
    });
};

const getInviteUrl = async (channel: TextChannel) => {
  // validate cache
  const getIsFreshTime = (date: Date): boolean => {
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - date.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const tarDays = 5; // 5일, 기본적으로 디스코드는 1주일 단위로 만료

    return diffDays < tarDays;
  };

  if (inMemoryCache?.inviteUrl && getIsFreshTime(inMemoryCache.time)) {
    return inMemoryCache.inviteUrl;
  }

  // get invite from channel
  const invite = await channel.createInvite({
    maxAge: 0, // 초대 만료 시간 (0이면 만료되지 않음)
    maxUses: 10, // 100 이하
    unique: true,
  });

  // update cache
  inMemoryCache = {
    inviteUrl: invite.url,
    time: new Date(),
  };

  return invite.url;
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
