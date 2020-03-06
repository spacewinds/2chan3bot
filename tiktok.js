const axios = require("axios");
let TikTokScraper = null;
setTimeout(() => {
    TikTokScraper = require("tiktok-scraper");
    console.log("TTS is ready");
}, 8000);

const randomInt = max => {
    return Math.floor(Math.random() * Math.floor(max));
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

export const downloadTiktokMeta = (url, onReady) => {
    axios
        .get("http://185.227.111.142/api/video/get-by-url?url=" + url)
        .then(function(response) {
            const meta = response.data;
            if (meta && meta.video && meta.video.download_url) {
                axios
                    .get(meta.video.download_url, {
                        responseType: "arraybuffer"
                    })
                    .then(fr => {
                        onReady(
                            meta,
                            require("buffer").Buffer.from(fr.data, "binary")
                        );
                    });
            }
        })
        .catch(function(error) {
            // handle error
            console.log(error);
        });
};
