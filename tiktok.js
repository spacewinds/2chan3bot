const axios = require("axios");
let hdMode = true;
let TikTokScraper = null;
setTimeout(() => {
    TikTokScraper = require("tiktok-scraper");
    console.log("TTS is ready");
}, 8000);

const randomInt = max => {
    return Math.floor(Math.random() * Math.floor(max));
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
    let headers = {
        Host: "api2-16-h2.musical.ly",
        Cookie:
            "odin_tt=504c787a61626247744d5373374f5966545e20c97e200df2c6babbf3e0b2a379cf111d0d8b56356def2e4e85159b0de3c4849158780db48d2d355c4255db2544; sid_guard=52c010a5dc1f4de4f97daf216654be70%7C1581615193%7C5184000%7CMon%2C+13-Apr-2020+17%3A33%3A13+GMT; uid_tt=7d64f61fb376e98ed49b99cfa57c7289370085be18a53913760e7ca8d9e6cd4f; uid_tt_ss=7d64f61fb376e98ed49b99cfa57c7289370085be18a53913760e7ca8d9e6cd4f; sid_tt=52c010a5dc1f4de4f97daf216654be70; sessionid=52c010a5dc1f4de4f97daf216654be70; sessionid_ss=52c010a5dc1f4de4f97daf216654be70; install_id=6792985469456271110; ttreq=1$5606c847b8602aee910c0cefa5beb9350978f309"
    };
    headers["x-tt-token"] =
        "0352c010a5dc1f4de4f97daf216654be708317d6694edf0c4f660e86a685b0a147c4d3596cf2a6a38eb849694e34cd8e8421";
    headers["sdk-version"] = "1";
    headers["x-tt-trace-id"] =
        "00-c8e9a425105b138cfb78c346060404d1-c8e9a425105b138c-01";
    headers["user-agent"] =
        "com.zhiliaoapp.musically/2021502040 (Linux; U; Android 6.0; ru_RU; M3E; Build/MRA58K; Cronet/TTNetVersion:79d23018 2020-02-03 QuicVersion:ac58aac6 2020-01-20)";
    headers["x-gorgon"] =
        "8401608600006dae06502e496e5f486c6024bfda6e3b0606a1e5";
    headers["x-khronos"] = "1583918719";
    console.log("headers", headers);

    const url = `https://api2-16-h2.musical.ly/aweme/v1/aweme/detail/?aweme_id=${id}&origin_type=web&request_source=0&os_api=23&device_type=M3E&ssmix=a&manifest_version_code=2021502040&dpi=480&uoo=0&carrier_region=RU&region=RU&carrier_region_v2=250&app_skin=white&app_name=musical_ly&version_name=15.2.4&timezone_offset=25200&ts=1583918594&ab_version=15.2.4&residence=US&pass-route=1&pass-region=1&is_my_cn=0&current_region=RU&ac2=wifi&app_type=normal&ac=wifi&update_version_code=2021502040&channel=googleplay&_rticket=1583918719658&device_platform=android&iid=6802871879000033029&build_number=15.2.4&locale=en&op_region=RU&version_code=150204&timezone_name=Asia%2FKrasnoyarsk&account_region=RU&openudid=d8cd89048fbfeac9&sys_region=RU&device_id=6562744093699687942&app_language=en&resolution=1080*1920&os_version=6.0&language=ru&device_brand=Meizu&aid=1233&mcc_mnc=25002`;

    axios
        .get(url, { headers })
        .then(response => {
            console.log("META DATA", response.data);
            if (onReady) onReady(response.data);
        })
        .catch(error => {
            console.log("META ERROR", error);
        });
};

export const downloadTiktokHD = (url, onReady) => {
    extractIdFromUrl(url, id => {
        //console.log()
        loadMetaInfo(id, data => {
            console.log("AWEME DATA", data);
            if (data) {
                const videoId = data.aweme_detail.video.play_addr.uri;
                console.log("ID VIDEO", videoId);
                const hdLink = `https://api2.musical.ly/aweme/v1/playwm/?video_id=${videoId}&improve_bitrate=1`;
                axios
                    .get(hdLink, {
                        responseType: "arraybuffer"
                    })
                    .then(function(response) {
                        console.log(response);
                        onReady({
                            meta: data.aweme_detail,
                            buffer: require("buffer").Buffer.from(
                                response.data,
                                "binary"
                            )
                        });
                    })
                    .catch(function(error) {
                        console.log("HDMOD ERROR", error);
                    });
            }
        });
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
    //const url = `https://api.tiktokv.com/aweme/v1/playwm/?video_id=v09044b20000brls6d9e3ejmgvhtbf3g&line=0&ratio=default&media_type=4&vr_type=0https://api2.musical.ly/aweme/v1/playwm/?video_id=${uri}&improve_bitrate=1`;

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
                    console.log("IQR ERROR", error);
                });
        })
        .catch(function(error) {
            console.log("HDMOD ERROR", error);
        });
};

export const downloadTiktokMeta = (url, onReady) => {
    if (hdMode && false) {
        downloadTiktokHD(url, result => {
            onReady(result.meta, result.buffer);
        });
    } else {
        axios
            .get("http://185.227.111.142/api/video/get-by-url?url=" + url)
            .then(function(response) {
                const meta = response.data;
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
            })
            .catch(function(error) {
                downloadTiktokEmergencyMode(url, onReady);
                console.log(error);
            });
    }
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
