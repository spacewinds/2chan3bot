const axios = require("axios");
var decode = require("decode-html");
var striptags = require("striptags");
import { jsonCopy } from "./utils";
var catalogData = null;
var currentThreadDesc = null;
var currentThreadData = null;
var lastPostTimeStamp = null;
var newPosts = [];

export const getCatalogData = (general = "bonbi") => {
    return state[general].catalogData;
};
export const getCurrentThreadData = (general = "bonbi") => {
    return state[general].currentThreadData;
};
export const getNewPosts = (general = "bonbi") => {
    return state[general].newPosts;
};

function decodeHtmlCharCodes(str) {
    return str.replace(/(&#(\d+);)/g, function(match, capture, charCode) {
        return String.fromCharCode(charCode);
    });
}

let state = {
    bonbi: {
        catalogData: null,
        currentThreadDesc: null,
        currentThreadData: null,
        lastPostTimeStamp: null,
        newPosts: [],
        keywords: ["бонби", "бoнб"]
    },
    richie: {
        catalogData: null,
        currentThreadDesc: null,
        currentThreadData: null,
        lastPostTimeStamp: null,
        newPosts: [],
        keywords: ["richie"]
    }
};

let store = {
    dvachGenerals: {
        bonbi: {
            threadChannel: null,
            linkMap: {}
        },
        richie: {
            threadChannel: null,
            linkMap: {}
        }
    }
};

export const findChannels = (client, general, channelName) => {
    setTimeout(() => {
        let channel = client.channels.cache.find(c => c.name === channelName);
        let result = [];
        let id = "";
        client.channels.cache.forEach(item => {
            if (item.name === channelName) {
                result.push(item);
                updateLinkMap(item, general);
            }
        });
        if (channel) {
            store.dvachGenerals[general].threadChannel = result;
        }
    }, 6000);
};

export const findMessageAttachmentInPost = post => {
    let result = undefined;
    if (post.files && post.files.length > 0) {
        post.files.forEach(item => {
            if (!result) {
                if (
                    item.path.toLowerCase().includes(".png") ||
                    item.path.toLowerCase().includes(".jpg") ||
                    item.path.toLowerCase().includes(".gif")
                ) {
                    result = "https://2ch.hk" + item.path;
                }
            }
        });
    }
    return result;
};

const sendNewPosts = general => {
    const newPostsD = getNewPosts(general);
    const currentThreadD = getCurrentThreadDesc(general);
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
                attachment: findMessageAttachmentInPost(p),
                date: new Date(p.timestamp * 1000)
            },
            thread: {
                name: currentThreadD.subject,
                url: "https://2ch.hk/fag/res/" + currentThreadD.num + ".html"
            },
            footerText: "#" + p.number
        });
        if (store.dvachGenerals[general].threadChannel) {
            store.dvachGenerals[general].threadChannel.forEach(item => {
                item.send({ embed: preprocessPost(item, embed, general) });
                setTimeout(() => {
                    updateLinkMap(item, general);
                }, 3000);
            });
        }
    });
};

const generatePost = data => {
    const result = {
        color: data.color ? data.color : 0x0099ff,
        title: data.thread.name + " #" + data.post.number,
        url: data.post.url,
        description: data.post.text,
        thumbnail: data.post.attachment
            ? {
                  url: data.post.attachment
              }
            : undefined,
        timestamp: data.post.date ? data.post.date : new Date(),
        footer: {
            text: data.footerText
        }
    };
    return result;
};

const preprocessPost = (channel, embed, general) => {
    const em = jsonCopy(embed);
    let newDescription = em.description;
    let result = em;
    const tokens = em.description.split(/(\s+)/);
    tokens.forEach(item => {
        if (item.substring(0, 8).includes(">>")) {
            let id = item.replace(">>", "");
            if (
                store.dvachGenerals[general].linkMap[channel.id] &&
                store.dvachGenerals[general].linkMap[channel.id]["#" + id]
            ) {
                newDescription = newDescription.replace(
                    item,
                    "[" +
                        item +
                        "](" +
                        store.dvachGenerals[general].linkMap[channel.id][
                            "#" + id
                        ] +
                        ")"
                );
            }
        }
    });
    result.description = newDescription;
    return result;
};

const updateLinkMap = (channel, general) => {
    let result = {};
    channel.messages
        .fetch({ limit: 100 })
        .then(messages => {
            const list = messages.last();
            const messagesArray = list.channel.messages.cache.array();
            messagesArray.forEach(mItem => {
                let currentTitle = mItem.embeds.length
                    ? mItem.embeds[0].title
                    : "";
                if (currentTitle) {
                    let lastToken = currentTitle.split(" ");
                    lastToken = lastToken[lastToken.length - 1];
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
            store.dvachGenerals[general].linkMap[channel.id] = result;
        })
        .catch(console.error);
};

export const createDvachThreadWorker = (general = "bonbi") => {
    setInterval(() => {
        reloadThread(general);
        getCurrentThreadDesc(general);
    }, 10000);

    setTimeout(() => {
        setInterval(() => {
            findNewPosts(general);
            const newPosts = getNewPosts(general);
            if (newPosts && newPosts.length) {
                sendNewPosts(general);
            }
        }, 15000);
    }, 5000);

    setInterval(() => {
        reloadCatalog(general);
        setTimeout(() => {
            findCurrentThread(general);
        }, 5000);
    }, 55000);
};

const checkSubject = (subject, keywords) => {
    let result = false;
    keywords.forEach(k => {
        if (subject.includes(k)) {
            result = true;
        }
    });
    return result;
};

export const getCurrentThreadDesc = (general = "bonbi") => {
    if (state[general].currentThreadDesc === null) {
        findCurrentThread(general);
    }
    return state[general].currentThreadDesc;
};

export const findBonbiThreadsSubjects = general => {
    const cat = getCatalogData(general);
    let threads = [];
    let list = [];
    if (cat) {
        if (cat.threads)
            cat.threads.forEach(item => {
                if (
                    checkSubject(
                        item.subject.toLowerCase(),
                        state[general].keywords
                    )
                ) {
                    threads.push(item);
                    list.push(item.subject);
                }
            });
    }
    return threads;
};

export const findCurrentThread = (general = "bonbi") => {
    const threads = findBonbiThreadsSubjects(general);
    if (threads && threads.length > 0) {
        state[general].currentThreadDesc = threads[0];
        return state[general].currentThreadDesc;
    }
};

export const reloadThread = (general = "bonbi") => {
    if (state[general].currentThreadDesc) {
        axios
            .get(
                "https://2ch.hk/fag/res/" +
                    state[general].currentThreadDesc.num +
                    ".json"
            )
            .then(function(response) {
                state[general].currentThreadData = response.data;
                //console.log("reload thread success");
            })
            .catch(function(error) {
                // handle error
                console.log(error);
            });
    } else {
        console.log("No current thread");
    }
};

export const findNewPosts = (general = "bonbi") => {
    if (!state[general].currentThreadData) return;
    if (!state[general].currentThreadData.threads) return;
    if (!state[general].currentThreadData.threads[0]) return;
    const data = state[general].currentThreadData.threads[0].posts;
    if (!state[general].lastPostTimeStamp) {
        state[general].lastPostTimeStamp = data[data.length - 1].timestamp;
        state[general].newPosts = [data[data.length - 1]];
    } else {
        state[general].newPosts = [];
        data.forEach(item => {
            if (item.timestamp > state[general].lastPostTimeStamp) {
                state[general].lastPostTimeStamp = item.timestamp;
                state[general].newPosts.push(item);
            }
        });
    }
};

export const reloadCatalog = (general = "bonbi") => {
    axios
        .get("https://2ch.hk/fag/catalog.json")
        .then(function(response) {
            state[general].catalogData = response.data;
        })
        .catch(function(error) {
            console.log(error);
        });
};
