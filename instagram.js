const axios = require("axios");
const Instagram = require("instagram-web-api");
const client = new Instagram({ username: "username", password: "password" });

export const getInstaUser = async (username, callback) => {
    const instagramUser = await client.getUserByUsername({ username });
    console.log("insta user", instagramUser);
    if (callback) callback(instagramUser);
};

getInstaUser("honey_cot");

export const getUserStories = (username, onReady, repeat = 3) => {
    const pk = null;
    getInstaUser(username, user => {
        let headers = {
            authority: "api.insta-stories.ru",
            pragma: "no-cache",
            accept: "application/json, text/plain, */*",
            dnt: "1",
            origin: "https://insta-stories.ru",
            referer: "https://insta-stories.ru/honey_cot"
        };
        headers["cache-control"] = "no-cache";
        headers["user-agent"] =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36";
        headers["content-type"] = "application/json";
        headers["sec-fetch-site"] = "same-site";
        headers["sec-fetch-mode"] = "cors";
        headers["sec-fetch-dest"] = "empty";
        headers["accept-language"] = "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7";

        let data = {};
        data["pk"] = user.id;
        data["x-trip"] = "7gd5a6a17e";

        axios
            .post("https://api.insta-stories.ru/profile", data, {
                headers: headers,
                timeout: 8000
            })
            .then(function(stories_data) {
                onReady(stories_data.data);
            })
            .catch(function(st_error) {
                console.log("stError", st_error);
                if (repeat > 0) getUserStories(username, onReady, repeat - 1);
            });
    });
};
