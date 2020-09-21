const Discord = require("discord.js");
var auth = require("./auth.json");
var crypto = require("crypto");
var moment = require("moment");
const sharp = require("sharp");
global.crypto = require("crypto");

import { calculateInfa } from "./infa";
import { reloadCatalog, createDvachThreadWorker, findChannels } from "./dvach";
import {
    downloadTiktokMeta,
    downloadURL,
    scrapUser,
    randomPost,
    loadMetaInfo
} from "./tiktok";
import { getUserStories } from "./instagram";
import { checkIfUserIsInGame } from "./lol";
import { jsonCopy, formatDate } from "./utils";

var client = new Discord.Client();
const VERSION = "8.9.2020/1242";
let isReady = false;
let scrap = {};
let scrapW = {};

client.once("ready", () => {
    console.log("Ready!");
    isReady = true;
    reloadCatalog();
    reloadCatalog("richie");
});
client.login(process.env.BOT_TOKEN);

createDvachThreadWorker("bonbi");
findChannels(client, "bonbi", "thread");

createDvachThreadWorker("richie");
findChannels(client, "richie", "richie-thread");

const scrapWorker = (username, channelName, timeout = 60000) => {
    setInterval(() => {
        console.log("scraping " + username);
        scrapUser(
            username,
            (success, result) => {
                if (success) {
                    if (scrapW[username]) {
                        if (
                            scrapW[username].collector &&
                            scrapW[username].collector.length > 0 &&
                            result.collector &&
                            result.collector.length > 0
                        ) {
                            if (
                                result.collector[0].createTime >
                                scrapW[username].collector[0].createTime
                            ) {
                                const video = result.collector[0];
                                const link =
                                    "https://www.tiktok.com/@" +
                                    username +
                                    "/video/" +
                                    video.id;

                                downloadTiktokMeta(link, (meta, buffer) => {
                                    client.channels.forEach(item => {
                                        if (item.name === channelName) {
                                            item.send(
                                                meta.video.description,
                                                new Discord.Attachment(
                                                    buffer,
                                                    meta.video.id + ".mp4"
                                                )
                                            );
                                        }
                                    });
                                });
                            }
                        }
                    }
                    scrapW[username] = result;
                } else {
                    console.log("Scrapping failed! " + result);
                }
            },
            10
        );
    }, timeout);
};

scrapWorker("bonbibonkers", "bonbi-new-stuff", 90000);
scrapWorker("bonbibonkers", "new-bonbi-stuff", 90000);

const putMain = text => {
    client.channels.forEach(channel => {
        if (channel.name === "general") {
            channel.send(text);
        }
    });
};

const forward = args => {
    const list_ = client.guilds.get("589192369048518723");
    list_.members.forEach(member => {
        if (member.user.tag === args[0]) {
            member.send(args[1]);
        }
    });
};

const backwards = (args, channel) => {
    const list_ = client.guilds.all("empty");
    list_.members.forEach(member => {
        if (member.user.name === args[0]) {
            member.send(args[0]);
        }
    });
    return channel.posts.by({ member: member.user.tag });
};

const downloadTiktok = (channel, url) => {
    downloadTiktokMeta(url, (meta, buffer) => {
        channel.send(
            meta.video.description,
            new Discord.Attachment(buffer, meta.video.id + ".mp4")
        );
    });
};

const downloadAvatar = (channel, url) => {
    downloadURL(url, buffer => {
        channel.send("", new Discord.Attachment(buffer, "avatar.png"));
    });
};

const createRoundAvatar = (channel, url) => {
    downloadURL(
        "https://cdn.discordapp.com/attachments/646718856790016000/662106977723351064/15752697505550.jpg",
        backBuffer => {
            downloadURL(url, buffer => {
                const width = 112,
                    r = width / 2,
                    circleShape = Buffer.from(
                        `<svg width="112" height="112">
  <defs>
    <clipPath id="cut-off-bottom">
      <polygon points="16 45, 0 19, 0 0, 99 0, 100 63, 40 56, 24 52" fill="none" stroke="black"/>
    </clipPath>
  </defs>
  <circle cx="50" cy="50" r="50" clip-path="url(#cut-off-bottom)" />
</svg>`
                    );

                sharp(buffer)
                    .resize(width, width)
                    .composite([
                        {
                            input: circleShape,
                            blend: "dest-in"
                        }
                    ])
                    .png()
                    .toBuffer((err, data, info) => {
                        console.log(err, info);
                        if (data) {
                            sharp(backBuffer)
                                .composite([
                                    {
                                        input: data,
                                        blend: "over",
                                        left: 212,
                                        top: 197
                                    }
                                ])
                                .png()
                                .toBuffer((err2, data2, info2) => {
                                    console.log(err2, info2);
                                    channel.send(
                                        "",
                                        new Discord.Attachment(
                                            data2,
                                            "lukoshko.png"
                                        )
                                    );
                                });
                        }
                    });
            });
        }
    );
};

client.on("voiceStateUpdate", (oldMember, newMember) => {
    const role = oldMember.guild.roles.find("name", "voice");
    if (newMember.voiceChannel) {
        newMember.addRole(role);
    } else {
        newMember.removeRole(role);
    }
});

client.on("presenceUpdate", (oldMember, newMember) => {
    let username = newMember.user.username;
    let status = newMember.user.presence.status;
});

const sendToGhoul = (
    guild,
    channel,
    tag,
    content,
    attachments,
    enabled = true
) => {
    if (enabled) {
        const gl = client.guilds.get("247682087543504897");
        let guildname = "";
        if (guild) guildname = guild.name + " ";
        if (gl) {
            let user = null;
            gl.members.forEach(member => {
                if (member.user.id === "666633875140902912") {
                    member.send(
                        guildname + channel + " " + tag + " " + content
                    );
                    if (attachments) {
                        attachments.array().forEach(att => {
                            member.send(att.url);
                        });
                    }
                }
            });
        }
    }
};

const getStories = (channel, username) => {
    getUserStories(username, data => {
        if (data) {
            data.forEach(story => {
                if (story.img) {
                    channel.send(
                        "",
                        new Discord.Attachment(
                            story.img.src,
                            Math.random()
                                .toString(36)
                                .substr(2, 5) + ".jpg"
                        )
                    );
                } else if (story.video) {
                    channel.send(
                        "",
                        new Discord.Attachment(
                            story.video.src,
                            Math.random()
                                .toString(36)
                                .substr(2, 5) + ".mp4"
                        )
                    );
                }
            });
        }
    });
};

const scrapf = (channel, username, count) => {
    scrapUser(
        username,
        (success, result) => {
            if (success) {
                scrap[username] = result;
                channel.send(
                    "Scrapped " +
                        username +
                        " successfully! [" +
                        result.collector.length +
                        "]"
                );
            } else {
                channel.send("Scrapping failed" + result);
            }
        },
        count
    );
};

const randomTTPost = (channel, username) => {
    if (scrap[username]) {
        randomPost(scrap[username], username, (meta, buffer) => {
            channel.send(
                meta.video.description,
                new Discord.Attachment(buffer, meta.video.id + ".mp4")
            );
        });
    } else {
        channel.send("user " + username + " is not scrapped yet");
    }
};

const processLink = (channel, text) => {
    if (text.includes("'tt")) {
        return;
    }
    let regex = /(https?:\/\/[^\s]+)/g;
    let link;

    let result = false;
    while ((link = regex.exec(text)) !== null) {
        const value = link[0];
        if (
            value.includes("https://www.tiktok.com/") ||
            value.includes("https://vm.tiktok.com/") ||
            value.includes("https://vt.tiktok.com/")
        ) {
            downloadTiktok(channel, value);
            result = false;
        }
    }
    return result;
};

const tryProvideAccess = message => {
    if (message && message.channel && message.channel.guild) {
        const channel = message.channel.guild.channels.find(
            "name",
            "passport-control"
        );
        let passportPlace = false;
        if (channel)
            if (message.channel.id === channel.id) passportPlace = true;

        if (passportPlace) {
            switch (message.content.toLowerCase()) {
                case "hi":
                case "hello":
                case "privet":
                case "хай":
                case "привет":
                    const role = message.channel.guild.roles.find(
                        "name",
                        "Citizen"
                    );
                    if (role && message.member.roles.array().length === 1) {
                        message.member.addRole(role);
                    }
                    break;
                default:
            }
        }
    }
};

client.on("messageDelete", message => {
    client.channels.forEach(item => {
        if (item.name === "bb-audit-log") {
            item.send(
                "user " +
                    message.member.user.tag +
                    " removed messsage " +
                    message.content
            );
        }
    });
});

client.on("message", async message => {
    if (message.author.id !== "644461857591263263")
        sendToGhoul(
            message.channel.guild,
            message.channel.name,
            message.author.tag,
            message.content,
            message.attachments
        );
    const content = message.content;
    if (processLink(message.channel, content)) return;
    tryProvideAccess(message);
    if (content.substring(0, 1) == "-") {
        var args = content.substring(1).split(" ");
        var cmd = args[0];
        args = args.splice(1);
        let text = args.join(" ");
        switch (cmd) {
            case "bbbleave":
                if (message.member.user.id === "131650829617856512") {
                    message.channel.guild.leave();
                } else
                    message.channel.send(
                        "you don't have permissions to run this command"
                    );
                break;
            case "meta":
                loadMetaInfo(args[0]);
            case "enableScrapeWorker":
                scrapWorker(args[0], args[1]);
                break;
            case "rp":
                randomTTPost(message.channel, text);
                break;
            case "scrape":
                scrapf(
                    message.channel,
                    args[0],
                    args.length > 1 ? args[1] : undefined
                );
                break;
            case "stories":
                getStories(message.channel, args[0]);
                break;
            case "forward":
                forward(text.split(" > "));
                break;
            case "putmain":
                putMain(text);
                break;
            case "users":
                const list__ = client.guilds.get("589192369048518723"); //589192369048518723
                list__.members.forEach(member => {
                    console.log(member.user.username + " / " + member.user.id);
                });
                break;
            case "lolgame":
                checkIfUserIsInGame(text, result => {
                    if (result)
                        message.channel.send(
                            "Player " + text + " is in the game!"
                        );
                    else
                        message.channel.send(
                            "Player " + text + " is NOT in the game!"
                        );
                });
                break;
            case "created":
                let user_ = message.guild.members.find(
                    val => val.user.tag === text
                );
                if (user_) {
                    message.channel.send(
                        user_.user.tag +
                            " was created at " +
                            formatDate(user_.user.createdAt)
                    );
                }
                break;
            case "avatar":
                user_ = message.guild.members.find(
                    val => val.user.tag === text
                );
                if (user_) {
                    downloadAvatar(message.channel, user_.user.avatarURL);
                }
                break;
            case "lukoshko":
                user_ = message.guild.members.find(
                    val => val.user.tag === text
                );
                if (user_) {
                    createRoundAvatar(message.channel, user_.user.avatarURL);
                }
                break;
            case "_ping":
                message.channel.send("Pong! [" + VERSION + "]");
                break;
            case "infa":
                if (text) {
                    message.channel.send(text + " - " + calculateInfa(text));
                }
                break;
        }
    }
});
