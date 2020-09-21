const axios = require("axios");
const Discord = require("discord.js");
let hdMode = true;
let TikTokScraper = null;
let scrapW = {};
let scrap = {};

setTimeout(() => {
    TikTokScraper = require("tiktok-scraper");
    console.log("TTS is ready");
}, 8000);

const randomInt = max => {
    return Math.floor(Math.random() * Math.floor(max));
};

export const scrapf = (channel, username, count) => {
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

export const randomTTPost = (channel, username) => {
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

export const scrapWorker = (client, username, channelName, timeout = 60000) => {
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

export const extractIdFromUrl = (url, onReady) => {
    if (url.includes("vm.tiktok.com/") || url.includes("vt.tiktok.com/")) {
        axios
            .get(url)
            .then(response => {
                const data = response.request.path;
                console.log("url data", response);
                const idx = data.indexOf(".html?u_code");
                if (idx >= 0) {
                    const result = data.slice(3, 3 + 19);
                    axios
                        .get(response.request.res.responseUrl, {
                            headers: {
                                "user-agent":
                                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
                                "sec-fetch-mode": "navigate"
                            }
                        })
                        .then(rsp => {
                            extractIdFromUrl(
                                rsp.request.res.responseUrl,
                                onReady
                            );
                        });
                }
            })
            .catch(error => {
                console.log("vmtterror", error);
            });
    } else if (url.includes("www.tiktok.com/")) {
        const idx = url.indexOf("/video/");
        const idxA = url.indexOf("@");
        let result = { videoId: "", userName: "" };

        if (idx >= 0) {
            result.videoId = url.slice(idx + 7, idx + 8 + 19);
        }
        if (idxA >= 0) {
            result.userName = url.slice(idxA + 1, idx);
        }
        console.log("RESULT", result);
        onReady(result);
    }
};

export const loadMetaInfo = (id, onReady) => {
    console.log("ID", id);
    let items = JSON.parse(process.env.REQUEST);
    const headersJson = JSON.parse(process.env.HEADERS);

    items["aweme_id"] = id;
    items["_rticket"] = Date.now() * 1 + 14400000;
    items["ts"] = Date.now() * 1 + 14400000;

    const url = `https://api2.musical.ly/aweme/v1/aweme/detail/?`;

    axios
        .get(url, {
            params: items,
            headers: headersJson
        })
        .then(response => {
            if (onReady)
                onReady({
                    desc: response.data.aweme_detail.desc,
                    video: {
                        uri: response.data.aweme_detail.video.play_addr.uri,
                        download_url:
                            response.data.aweme_detail.video.play_addr
                                .url_list[0],
                        id
                    }
                });
        })
        .catch(error => {
            console.log("META ERROR", error);
        });
};

export const scrapUser = async (user, onReady, maxPosts = 300) => {
    console.log("scrapUser params", user, onReady, maxPosts);
    try {
        const posts = await TikTokScraper.user(user, {
            number: maxPosts
        });
        onReady(true, posts);
    } catch (error) {
        console.log("scrap error?", error);
        onReady(false, error.toString());
    }
};

export const randomPost = (collection, username, onReady) => {
    if (collection && collection.collector) {
        const video =
            collection.collector[randomInt(collection.collector.length)];
        const link =
            "https://www.tiktok.com/@" + username + "/video/" + video.id;
        downloadTiktokMeta(link, onReady);
        console.log("video", video);
    }
};

export const downloadURL = (url, onReady) => {
    axios
        .get(url, {
            responseType: "arraybuffer"
        })
        .then(fr => {
            onReady(require("buffer").Buffer.from(fr.data, "binary"));
        })
        .catch(error => {
            console.log(error);
        });
};

const improveQuality = (meta, buf, onReady, count = 0) => {
    if (count > 5) return;
    console.log("META", meta);
    if (!hdMode) return buf;
    const uri = meta ? (meta.video ? meta.video.uri : "") : "";
    if (!uri) onReady(buf);
    //https://api.tiktokv.com/aweme/v1/playwm/?video_id=v09044b20000brls6d9e3ejmgvhtbf3g&line=0&ratio=default&media_type=4&vr_type=0
    //https://api2.musical.ly/aweme/v1/playwm/?video_id=${uri}&improve_bitrate=1`;
    //const url = `https://api.tiktokv.com/aweme/v1/playwm/?video_id=${uri}&line=0&ratio=default&media_type=4&vr_type=0`;

    const url = `https://api2-16-h2.musical.ly/aweme/v1/play/?video_id=${uri}&ratio=default&improve_bitrate=1`;
    let headers = {
        responseType: "arraybuffer"
    };
    headers["user-agent"] = "tiktokapp";

    axios
        .get(url, { headers: { "User-Agent": "tiktokapp" } })
        .then(function(response) {
            const iqr = response.request.res.responseUrl;
            if (!iqr) {
                improveQuality(meta, buf, onReady, count + 1);
                return;
            }
            axios
                .get(iqr, {
                    responseType: "arraybuffer"
                })
                .then(iqrResult => {
                    const ibuf = require("buffer").Buffer.from(
                        iqrResult.data,
                        "binary"
                    );
                    if (ibuf && ibuf.length > 214) onReady(ibuf);
                    else {
                        improveQuality(meta, buf, onReady, count + 1);
                    }
                })
                .catch(iqrError => {
                    console.log("IQR ERROR", iqrError);
                });
        })
        .catch(function(error) {
            console.log("HDMOD ERROR", error);
        });
};

export const downloadTiktokMeta = (url, onReady) => {
    extractIdFromUrl(url, desc => {
        loadMetaInfo(desc.videoId, meta => {
            if (meta && meta.video && meta.video.download_url) {
                if (hdMode) {
                    improveQuality(meta, null, buffer => {
                        onReady(meta, buffer);
                    });
                } else {
                    axios
                        .get(meta.video.download_url, {
                            responseType: "arraybuffer"
                        })
                        .then(fr => {
                            onReady(
                                meta,
                                improveQuality(
                                    meta,
                                    require("buffer").Buffer.from(
                                        fr.data,
                                        "binary"
                                    )
                                )
                            );
                        });
                }
            }
        });
    });
};

export const downloadTiktokEmergencyMode = (url, onReady) => {
    console.log("downloading in emergency mode");
    extractIdFromUrl(url, config => {
        console.log("CONFIG", config);

        scrapUser(
            config.userName,
            (success, result) => {
                if (success) {
                    let i = 0;
                    for (i = 0; i < result.collector.length; i++) {
                        const item = result.collector[i];
                        if (item.id === config.videoId) {
                            axios
                                .get(item.videoUrl, {
                                    responseType: "arraybuffer"
                                })
                                .then(videoBuf => {
                                    const idx = videoBuf.data.indexOf(
                                        "vid:",
                                        0,
                                        "ascii"
                                    );
                                    const vid = videoBuf.data
                                        .slice(idx + 4, idx + 36)
                                        .toString("ascii");
                                    console.log("vidid", vid);

                                    const url = `https://api2.musical.ly/aweme/v1/playwm/?video_id=${vid}&improve_bitrate=1`;
                                    axios
                                        .get(url, {
                                            responseType: "arraybuffer"
                                        })
                                        .then(function(response) {
                                            const iqr =
                                                response.request.res
                                                    .responseUrl;
                                            axios
                                                .get(iqr, {
                                                    responseType: "arraybuffer"
                                                })
                                                .then(iqrResult => {
                                                    onReady(
                                                        {
                                                            video: {
                                                                description:
                                                                    item.text
                                                            }
                                                        },
                                                        require("buffer").Buffer.from(
                                                            iqrResult.data,
                                                            "binary"
                                                        )
                                                    );
                                                })
                                                .catch(iqrError => {
                                                    console.log(
                                                        "IQR ERROR",
                                                        error
                                                    );
                                                });
                                        })
                                        .catch(function(error) {
                                            console.log("HDMOD ERROR", error);
                                        });
                                })
                                .catch(error => {
                                    console.log("videoBufError", error);
                                });
                        }
                    }
                }
                console.log("SCRAP", success, result);
            },
            200
        );
    });
};
