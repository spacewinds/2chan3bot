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
    const short = "https://vm.tiktok.com/srFfyy/";
    const long =
        "https://www.tiktok.com/@kizunaai0630/video/6799 2608 5224 4598 018";

    if (url.includes("vm.tiktok.com/")) {
        axios
            .get(url)
            .then(response => {
                const data = response.request.path;
                //console.log("url data", response.request.path);
                const idx = data.indexOf(".html?u_code");
                if (idx >= 0) {
                    const result = data.slice(3, 3 + 19);
                    console.log("result", result);
                    onReady(result);
                }
            })
            .catch(error => {
                console.log("vmtterror", error);
            });
    } else if (url.includes("www.tiktok.com/")) {
        const idx = url.indexOf("/video/");
        if (idx >= 0) {
            const result = url.slice(idx + 7, idx + 8 + 19);
            //console.log("result", result);
            onReady(result);
        }
    }
};

export const loadMetaInfo = (id, onReady) => {
    let headers = {
        Host: "api2-16-h2.musical.ly",
        Cookie:
            "odin_tt=504c787a61626247744d5373374f5966545e20c97e200df2c6babbf3e0b2a379cf111d0d8b56356def2e4e85159b0de3c4849158780db48d2d355c4255db2544; sid_guard=52c010a5dc1f4de4f97daf216654be70%7C1581615193%7C5184000%7CMon%2C+13-Apr-2020+17%3A33%3A13+GMT; uid_tt=7d64f61fb376e98ed49b99cfa57c7289370085be18a53913760e7ca8d9e6cd4f; uid_tt_ss=7d64f61fb376e98ed49b99cfa57c7289370085be18a53913760e7ca8d9e6cd4f; sid_tt=52c010a5dc1f4de4f97daf216654be70; sessionid=52c010a5dc1f4de4f97daf216654be70; sessionid_ss=52c010a5dc1f4de4f97daf216654be70; install_id=6792985469456271110; ttreq=1$5606c847b8602aee910c0cefa5beb9350978f309"
    };
    headers["x-tt-token"] =
        "0352c010a5dc1f4de4f97daf216654be706d633d154c0d2ba9254a2e02ea3aecbd4b847458509bfe32bf5a924626232fb017";
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
            console.log(response.data);
            onReady(response.data);
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

export const scrapUser = async (user, onReady, maxPosts = 100) => {
    try {
        const posts = await TikTokScraper.user(user, {
            number: maxPosts
        });
        onReady(true, posts);
    } catch (error) {
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

const improveQuality = (meta, buf, onReady) => {
    console.log("META", meta);
    if (!hdMode) onReady(buf);
    const uri = meta ? (meta.video ? meta.video.uri : "") : "";
    if (!uri) onReady(buf);
    const url = `https://api2.musical.ly/aweme/v1/playwm/?video_id=${uri}&improve_bitrate=1`;

    axios
        .get(url, {
            responseType: "arraybuffer"
        })
        .then(function(response) {
            const iqr = response.request.res.responseUrl;
            axios
                .get(iqr, {
                    responseType: "arraybuffer"
                })
                .then(iqrResult => {
                    onReady(
                        require("buffer").Buffer.from(iqrResult.data, "binary")
                    );
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
                // handle error
                console.log(error);
            });
    }
};
