"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const express_1 = __importDefault(require("express"));
// CONFIG
dotenv_1.default.config();
const app = (0, express_1.default)();
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
// ENV
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// 디스코드 유저 설정 -> 고급 -> 개발자 모드 활성화 -> 필요한 서버, 채널 우클릭
const GUILD_ID = process.env.GUILD_ID;
// const CHANNEL_ID = process.env.CHANNEL_ID as string;
const PORT = process.env.PORT;
// CACHE
/**
 * - 현재, vercel serverless로 배포중
 * - 참여자가 연속적으로 (아마 무료 플랜 기준 10분?) 들어와 hot start가 발생시 유효하나, cold start에선 null임이 보장
 * - 만약 aws ec2등으로 배포하면 이 캐시가 많이 쓰일지도 모르나 솔직히 vercel로 해도 충분하다 생각(어차피 몇명씩 들어오는데...)
 * - 개인프로잭트니까 이정도 잡일(?)은 허용하자.
 */
let inMemoryCache = undefined;
// BOT
client.once("ready", () => {
    var _a;
    console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
});
client.login(DISCORD_TOKEN);
// SERVER
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guild = yield client.guilds.fetch(GUILD_ID);
        if (!guild) {
            res.status(404).send("Guild not found.");
        }
        const channel = yield getChannel(guild);
        if (!channel) {
            res.status(404).send("Channel not found.");
            return;
        }
        const url = yield getInviteUrl(channel);
        if (!url) {
            res.status(404).send("Invite url is not created.");
        }
        res.redirect(url);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error creating invite.");
    }
}));
const getChannel = (guild) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const cachedChannel = (_b = (_a = guild.channels) === null || _a === void 0 ? void 0 : _a.cache) === null || _b === void 0 ? void 0 : _b.find((ch) => ch.type === discord_js_1.ChannelType.GuildText);
    if (cachedChannel) {
        return cachedChannel;
    }
    return guild.channels
        .fetch()
        .then((channels) => {
        return channels.find((ch) => (ch === null || ch === void 0 ? void 0 : ch.type) === discord_js_1.ChannelType.GuildText);
    })
        .catch((e) => {
        throw new Error(e);
    });
});
const getInviteUrl = (channel) => __awaiter(void 0, void 0, void 0, function* () {
    // validate cache
    const getIsFreshTime = (date) => {
        const now = new Date();
        const diffMs = Math.abs(now.getTime() - date.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const tarDays = 5; // 5일, 기본적으로 디스코드는 1주일 단위로 만료
        return diffDays < tarDays;
    };
    if ((inMemoryCache === null || inMemoryCache === void 0 ? void 0 : inMemoryCache.inviteUrl) && getIsFreshTime(inMemoryCache.time)) {
        return inMemoryCache.inviteUrl;
    }
    // get invite from channel
    const invite = yield channel.createInvite({
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
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
module.exports = app;
