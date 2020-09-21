const axios = require("axios");
const { Kayn, REGIONS } = require("kayn");
//const kayn = Kayn(process.env.RIOT_API)();

export const checkIfUserIsInGame = (nickname, onReady) => {
    kayn.Summoner.by
        .name(nickname)
        .then(summoner => {
            kayn.CurrentGame.by
                .summonerID(summoner.id)
                .then(info => {
                    onReady(true);
                })
                .catch(infoe => {
                    onReady(false);
                });
        })
        .catch(error => console.error(error));
};

export const checkIfUserIsInGameopgg = (nickname, onReady) => {
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
