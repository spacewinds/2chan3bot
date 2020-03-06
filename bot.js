const Discord = require("discord.js");
var logger = require("winston");
var auth = require("./auth.json");
var crypto = require("crypto");
var decode = require("decode-html");
var striptags = require("striptags");
var moment = require("moment");
const sharp = require("sharp");
import { exampleEmbed, generatePost } from "./embeds";
import { calculateInfa } from "./infa";
import {
    reloadCatalog,
    getCatalogData,
    findBonbiThreadsSubjects,
    getCurrentThreadDesc,
    getCurrentThreadData,
    reloadThread,
    getNewPosts,
    findNewPosts,
    findCurrentThread
} from "./dvach";
import {
    downloadTiktokMeta,
    downloadURL,
    scrapUser,
    randomPost
} from "./tiktok";
import { getUserStories } from "./instagram";
import { checkIfUserIsInGame } from "./lol";
// Configure logger settings
global.crypto = require("crypto");
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
    colorize: true
});
logger.level = "debug";
// Initialize Discord Bot
var client = new Discord.Client();
const VERSION = "9.1.2020/1459";
var threadChannel = null;
let linkMap = {};
var crvLog = [];
let bonbiWasInGame = false;
let isReady = false;
let scrap = {};

client.once("ready", () => {
    console.log("Ready!");
    isReady = true;
    reloadCatalog();
});

//client.login(auth.token);
client.login(process.env.BOT_TOKEN);
const findAttachmentInPost = post => {
    let result = undefined;
    if (post.files && post.files.length > 0) {
        post.files.forEach(item => {
            if (!result) {
                if (
                    item.path.toLowerCase().includes(".png") ||
                    item.path.toLowerCase().includes(".jpg") ||
                    item.path.toLowerCase().includes(".gif")
                ) {
                    console.log("GONNA RETURN " + "https://2ch.hk" + item.path);
                    result = "https://2ch.hk" + item.path;
                }
            }
        });
    }
    return result;
};

function decodeHtmlCharCodes(str) {
    return str.replace(/(&#(\d+);)/g, function(match, capture, charCode) {
        return String.fromCharCode(charCode);
    });
}

setInterval(() => {
    //console.log("updating");
    reloadThread();
    getCurrentThreadDesc();
}, 10000);

setTimeout(() => {
    setInterval(() => {
        findNewPosts();
        const newPosts = getNewPosts();
        if (newPosts && newPosts.length) {
            sendNewPosts();
        }
    }, 15000);
}, 5000);

setInterval(() => {
    //console.log("updating catalog");
    reloadCatalog();
    setTimeout(() => {
        findCurrentThread();
    }, 5000);
}, 55000);

const scrapWorker = (username, channelName, timeout = 60000) => {
    setInterval(() => {
        console.log("scraping " + username);
        scrapUser(username, (success, result) => {
            if (success) {
                if (scrap[username]) {
                    if (
                        scrap[username].collector &&
                        scrap[username].collector.length > 0 &&
                        result.collector &&
                        result.collector.length > 0
                    ) {
                        if (
                            result.collector[0].createTime >=
                            scrap[username].collector[0].createTime
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

                scrap[username] = result;
            } else {
                console.log("Scrapping failed! " + result);
            }
        });
    }, timeout);
};

scrapWorker("bonbibonkers", "bonbi-new-stuff", 90000);

/*
setInterval(() => {
    checkIfUserIsInGame("Bonbishka", active => {
        console.log("checking bonbi's game: ", active);
        if (client && isReady) {
            if (bonbiWasInGame !== active) {
                bonbiWasInGame = active ? true : false;

                const gl = client.guilds.get("589192369048518723");
                if (gl) {
                    let user = null;
                    gl.members.forEach(member => {
                        if (member.user.id === "131650829617856512") {
                            member.send(
                                (active
                                    ? "Bonbishka is in the game!"
                                    : "Bonbishka is NOT in the game!") +
                                    " / " +
                                    moment().format("HH:mm:ss")
                            );
                        }
                    });
                }
            }
        }
    });
}, 45000);*/

setTimeout(() => {
    let channel = client.channels.find("name", "thread");
    let result = [];
    let id = "";
    client.channels.forEach(item => {
        if (item.name === "thread") {
            result.push(item);
            updateLinkMap(item);
        }
    });
    //console.log("CHANNELS!!!", result.length);
    if (channel) threadChannel = result;
    //console.log("WORKING CHANNEL", threadChannel);
    console.log("clientid", client.user.id);
}, 5000);

const jsonCopy = src => {
    return JSON.parse(JSON.stringify(src));
};

const putMain = text => {
    client.channels.forEach(channel => {
        if (channel.name === "general") {
            channel.send(text);
        }
    });
};

const prune = (channel, guild, days, dry = true) => {
    guild
        .pruneMembers(parseInt(days), true)
        .then(pruned => {
            channel.send(`This will prune ${pruned} people!`);
            console.log(`This will prune ${pruned} people!`);
        })
        .catch(console.error);
};

const forward = args => {
    const list_ = client.guilds.get("589192369048518723"); //589192369048518723
    list_.members.forEach(member => {
        if (member.user.tag === args[0]) {
            member.send(args[1]);
        }
    });
};

const updateLinkMap = channel => {
    let result = {};
    channel
        .fetchMessages()
        .then(messages => {
            const list = messages.last();
            const messagesArray = list.channel.messages.array();
            messagesArray.forEach(mItem => {
                let currentTitle = mItem.embeds.length
                    ? mItem.embeds[0].title
                    : "";
                if (currentTitle) {
                    let lastToken = currentTitle.split(" ");
                    lastToken = lastToken[lastToken.length - 1];
                    //console.log("lastToken", lastToken);
                    if (lastToken) {
                        result[lastToken] =
                            "https://discordapp.com/channels/" +
                            mItem.channel.guild.id +
                            "/" +
                            mItem.channel.id +
                            "/" +
                            mItem.id;
                    }
                }
            });
            linkMap[channel.id] = result;
        })
        .catch(console.error);
};

const preprocessPost = (channel, embed) => {
    const em = jsonCopy(embed);
    let newDescription = em.description;
    let result = em;
    const tokens = em.description.split(/(\s+)/);
    tokens.forEach(item => {
        if (item.substring(0, 8).includes(">>")) {
            let id = item.replace(">>", "");
            if (linkMap[channel.id] && linkMap[channel.id]["#" + id]) {
                newDescription = newDescription.replace(
                    item,
                    "[" + item + "](" + linkMap[channel.id]["#" + id] + ")"
                );
            }
        }
    });
    result.description = newDescription;
    return result;
};

const sendNewPosts = () => {
    const newPostsD = getNewPosts();
    const currentThreadD = getCurrentThreadDesc();
    newPostsD.forEach(p => {
        const embed = generatePost({
            post: {
                number: p.num,
                url:
                    "https://2ch.hk/fag/res/" +
                    currentThreadD.num +
                    ".html#" +
                    p.num,
                text: decodeHtmlCharCodes(
                    striptags(decode(p.comment), [], "\n")
                ),
                attachment: findAttachmentInPost(p),
                date: new Date(p.timestamp * 1000)
            },
            thread: {
                name: currentThreadD.subject,
                url: "https://2ch.hk/fag/res/" + currentThreadD.num + ".html"
            },
            footerText: "#" + p.number
        });
        if (threadChannel) {
            threadChannel.forEach(item => {
                item.send({ embed: preprocessPost(item, embed) });
                setTimeout(() => {
                    updateLinkMap(item);
                }, 3000);
            });
        }
    });
};
const formatDate = (date, isTime = false) => {
    if (isTime) {
        return moment().format();
    }
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    var day = date.getDay();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var seconds = date.getSeconds();

    return (
        day +
        " " +
        monthNames[monthIndex] +
        " " +
        year +
        (isTime ? " " + hour + ":" + minute + "::" + seconds : "")
    );
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
                        console.log("POP READY", info);
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
                                    console.log("COMPOSITE READY", info);
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
    /*
    console.log(
        `${newMember.user.username} / ${newMember.user.id}  is now ${
            newMember.user.presence.status
        }`
    );*/

    /*
    if (newMember.user.id === "641540291446177793") {
        crvLog.push({
            status: newMember.user.presence.status,
            time: formatDate(Date.now(), true)
        });

        const gl = client.guilds.get("589192369048518723");
        if (gl) {
            let user = null;
            gl.members.forEach(member => {
                if (member.user.id === "131650829617856512") {
                    member.send(
                        newMember.user.username +
                            " went " +
                            newMember.user.presence.status +
                            " / " +
                            moment().format("HH:mm:ss")
                    );
                }
            });
        }
    }*/
});

const sendToGhoul = (channel, tag, content, enabled = true) => {
    if (enabled) {
        const gl = client.guilds.get("247682087543504897");
        if (gl) {
            let user = null;
            gl.members.forEach(member => {
                if (member.user.id === "666633875140902912") {
                    member.send(channel + " " + tag + " " + content);
                }
            });
        }
    }
};

const getStories = (channel, username) => {
    getUserStories(username, data => {
        console.log("data", data);
        if (data.stories) {
            data.stories.forEach(story => {
                if (story.img) {
                    channel.send(
                        "",
                        new Discord.Attachment(story.img, story.id + ".jpg")
                    );
                } else if (story.video) {
                    channel.send(
                        "",
                        new Discord.Attachment(
                            story.video.url,
                            story.id + ".mp4"
                        )
                    );
                }
            });
        }
    });
};

const scrapf = (channel, username) => {
    scrapUser(username, (success, result) => {
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
    });
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
    console.log("text", text);
    let regex = /(https?:\/\/[^\s]+)/g;
    let link;

    let result = false;
    while ((link = regex.exec(text)) !== null) {
        const value = link[0];
        if (
            value.includes("https://www.tiktok.com/") ||
            value.includes("https://vm.tiktok.com/")
        ) {
            downloadTiktok(channel, value);
            result = false;
        }
    }
    return result;
};

client.on("message", async message => {
    if (message.author.id !== "644461857591263263")
        sendToGhoul(message.channel.name, message.author.tag, message.content);

    console.log(
        "MESSAGE",
        message.channel.name,
        message.author.tag,
        message.content
    );
    const content = message.content;
    if (processLink(message.channel, content)) return;
    if (content.substring(0, 1) == "-") {
        var args = content.substring(1).split(" ");
        var cmd = args[0];
        args = args.splice(1);
        let text = args.join(" ");
        switch (cmd) {
            case "enableScrapWorker":
                scrapWorker(args[0], args[1]);
                break;
            case "rp":
                randomTTPost(message.channel, text);
                break;
            case "scrap":
                scrapf(message.channel, text);
                break;
            case "stories":
                getStories(message.channel, args[0]);
                break;
            case "prunedry":
                prune(message.channel, message.guild, args[0]);
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
            case "_spyfox":
                const list_ = client.guilds.get("589192369048518723"); //589192369048518723
                if (list_) {
                    list_.members.forEach(member => {
                        console.log(
                            member.user.username +
                                " / " +
                                member.user.id +
                                " / " +
                                member.user.createdAt
                        );
                    });
                    message.channel.send("ok");
                } else message.channel.send("not ok");
                break;
            case "_sfcrv":
                console.log(crvLog);
                message.channel.send("ok");
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
            case "displayAvatar":
                user_ = message.guild.members.find(
                    val => val.user.tag === text
                );
                if (user_) {
                    downloadAvatar(
                        message.channel,
                        user_.user.displayAvatarURL
                    );
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
            case "lukoshko1":
                user_ = client.users.find(val => val.tag === text);
                if (user_) {
                    createRoundAvatar(message.channel, user_.avatarURL);
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
            case "embed":
                message.channel.send({ embed: exampleEmbed });
                message.channel.send(
                    "",
                    new Discord.Attachment("https://i.imgur.com/w3duR07.png")
                );
                break;
            case "catalog":
                const list = findBonbiThreadsSubjects(true);
                console.log("List", list);
                message.channel.send(list.join("\n").substring(0, 2000));
                break;
            case "latest":
                const thread = getCurrentThreadDesc();
                message.channel.send(thread.subject + " / " + thread.num);
                break;
        }
    }
});
