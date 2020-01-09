const axios = require("axios");

export const checkIfUserIsInGame = (nickname, onReady) => {
    axios
        .get("https://na.op.gg/summoner/spectator/userName=" + nickname, {
            responseType: "arraybuffer"
        })
        .then(fr => {
            const text = require("buffer")
                .Buffer.from(fr.data, "binary")
                .toString();
            if (text) {
                onReady(
                    !(
                        text.includes("SpectatorError") ||
                        text.includes("is not in an active")
                    )
                );
            }
        })
        .catch(error => {
            console.log(error);
        });
};
