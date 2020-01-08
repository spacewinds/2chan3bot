const Discord = require("discord.js");
var logger = require("winston");
var auth = require("./auth.json");
var crypto = require("crypto");
var decode = require("decode-html");
var striptags = require("striptags");
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
import { downloadTiktokMeta } from "./tiktok";
// Configure logger settings
global.crypto = require("crypto");
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
    colorize: true
});
logger.level = "debug";
// Initialize Discord Bot
var client = new Discord.Client();
const VERSION = "8.1.2020/1830";
var threadChannel = null;
let linkMap = {};
var crvLog = [];

client.once("ready", () => {
    console.log("Ready!");
    reloadCatalog();
});

//client.login(auth.token);
client.login(process.env.BOT_TOKEN);
const findAttachmentInPost = post => {
    console.log("ATTACHMENT", post);
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
    console.log("updating");
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
    console.log("updating catalog");
    reloadCatalog();
    setTimeout(() => {
        findCurrentThread();
    }, 5000);
}, 55000);

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
    console.log("CHANNELS!!!", result.length);
    if (channel) threadChannel = result;
    //console.log("WORKING CHANNEL", threadChannel);
    console.log("clientid", client.user.id);
}, 5000);

const jsonCopy = src => {
    return JSON.parse(JSON.stringify(src));
};

const updateLinkMap = channel => {
    let result = {};
    channel
        .fetchMessages()
        .then(messages => {
            console.log(
                `${
                    messages.filter(m => m.author.id === client.user.id).size
                } messages`
            );
            const list = messages.last();
            const messagesArray = list.channel.messages.array();
            messagesArray.forEach(mItem => {
                //console.log("ITEM", mItem);
                /*console.log(
                    "https://discordapp.com/channels/" +
                        mItem.channel.guild.id +
                        "/" +
                        mItem.channel.id +
                        "/" +
                        mItem.id
                );*/
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
            console.log("updateLinkMap => ", channel.id, result);
            linkMap[channel.id] = result;
        })
        .catch(console.error);
};

const preprocessPost = (channel, embed) => {
    console.log("LINMAP", linkMap);
    console.log("preprocessPost", embed.description, channel.id);
    const em = jsonCopy(embed);
    let newDescription = em.description;
    let result = em;
    const tokens = em.description.split(/(\s+)/);
    tokens.forEach(item => {
        if (item.substring(0, 8).includes(">>")) {
            let id = item.replace(">>", "");
            if (linkMap[channel.id] && linkMap[channel.id]["#" + id]) {
                console.log("found in history");
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

const downloadTiktok = (channel, url) => {
    downloadTiktokMeta(url, (meta, buffer) => {
        channel.send(
            meta.video.description,
            new Discord.Attachment(buffer, meta.video.id + ".mp4")
        );
    });
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
    console.log(
        `${newMember.user.username} / ${newMember.user.id}  is now ${
            newMember.user.presence.status
        }`
    );
});

client.on("message", async message => {
    console.log("MESSAGE", message.content);
    const content = message.content;
    if (content.substring(0, 1) == "-") {
        var args = content.substring(1).split(" ");
        var cmd = args[0];
        console.log("args before", args);
        args = args.splice(1);
        let text = args.join(" ");
        console.log("args after", text);
        switch (cmd) {
            case "_spyfox":
                const list_ = client.guilds.get("589192369048518723"); //589192369048518723
                if (list_) {
                    list_.members.forEach(member => {
                        console.log(
                            member.user.username + " / " + member.user.id
                        );
                    });
                    message.channel.send("ok");
                } else message.channel.send("not ok");
                break;
            case "_ping":
                message.channel.send("Pong! [" + VERSION + "]");
                break;
            case "infa":
                if (text) {
                    message.channel.send(text + " - " + calculateInfa(text));
                }
                break;
            case "dl":
                downloadTiktok(message.channel, text);
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
            case "_reload_thread":
                reloadThread();
                break;
            case "_post_count":
                const data = getCurrentThreadData();
                message.channel.send(data.threads[0].posts.length);
                break;
            case "_new_posts_count":
                let newPosts = getNewPosts();
                message.channel.send(newPosts.length);
                break;
            case "_find_new_posts":
                findNewPosts();
                break;
            case "embed_last_post":
                const threadData = getCurrentThreadData();
                const p =
                    threadData.threads[0].posts[
                        threadData.threads[0].posts.length - 1
                    ];
                const currentThreadD = getCurrentThreadDesc();
                const embed = generatePost({
                    post: {
                        number: p.num,
                        url:
                            "https://2ch.hk/fag/res/" +
                            currentThreadD.num +
                            ".html#" +
                            p.num,
                        text: striptags(decode(p.comment), [], " "),
                        attachment: findAttachmentInPost(p),
                        date: new Date(p.timestamp * 1000)
                    },
                    thread: {
                        name: currentThreadD.subject,
                        url:
                            "https://2ch.hk/fag/res/" +
                            currentThreadD.num +
                            ".html"
                    },
                    footerText: "#" + p.number
                });
                message.channel.send({ embed });
                break;
        }
    }
});
