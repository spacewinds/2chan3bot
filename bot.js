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
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
    colorize: true
});
logger.level = "debug";
// Initialize Discord Bot
var client = new Discord.Client();
var threadChannel = null;
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
            if (
                item.path.toLowerCase().includes(".png") ||
                item.path.toLowerCase().includes(".jpg")
            ) {
                console.log("GONNA RETURN " + "https://2ch.hk" + item.path);
                result = "https://2ch.hk" + item.path;
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
    if (channel) threadChannel = channel;
    console.log("WORKING CHANNEL", threadChannel);
}, 5000);

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
                text: striptags(decode(p.comment), [], "\n"),
                attachment: findAttachmentInPost(p),
                date: new Date(p.timestamp * 1000)
            },
            thread: {
                name: currentThreadD.subject,
                url: "https://2ch.hk/fag/res/" + currentThreadD.num + ".html"
            },
            footerText: "#" + p.number
        });
        threadChannel.send({ embed });
    });
};

client.on("message", async message => {
    console.log("MESSAGE", message.content);
    const content = message.content;
    if (content.substring(0, 1) == "!") {
        var args = content.substring(1).split(" ");
        var cmd = args[0];
        console.log("args before", args);
        args = args.splice(1);
        let text = args.join(" ");
        console.log("args after", text);
        switch (cmd) {
            case "ping":
                message.channel.send("Pong!");
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
                            text: striptags(decode(p.comment), [], "\n"),
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
                });
                break;
        }
    }
});
