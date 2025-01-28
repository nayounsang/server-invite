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
dotenv_1.default.config();
const app = (0, express_1.default)();
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
// 디스코드 유저 설정 -> 고급 -> 개발자 모드 활성화 -> 필요한 서버, 채널 우클릭
const GUILD_ID = process.env.GUILD_ID;
// const CHANNEL_ID = process.env.CHANNEL_ID as string;
const PORT = process.env.PORT;
client.once("ready", () => {
    var _a;
    console.log(`Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
});
client.login(DISCORD_TOKEN);
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guild = yield client.guilds.fetch(GUILD_ID);
        if (!guild) {
            res.status(404).send("Guild not found.");
        }
        const channel = yield getChannel(guild);
        if (!channel) {
            console.log(yield guild.channels.fetch());
            console.log(guild.channels.cache);
            res.status(404).send("Channel not found.");
            return;
        }
        const invite = yield channel.createInvite({
            maxAge: 0, // 초대 만료 시간 (0이면 만료되지 않음)
            maxUses: 10, // 100 이하
            unique: true,
        });
        const url = invite.url;
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
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
module.exports = app;
