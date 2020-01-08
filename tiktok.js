const axios = require("axios");

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
