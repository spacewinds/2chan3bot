const axios = require("axios");

export const getUserStories = (username, onReady, repeat = 3) => {
    console.log("GetUserStories", username, repeat);
    const pk = null;
    axios
        .get("https://instagram.com/" + username + "/?__a=1")
        .then(function(response) {
            const info = response.data;
            if (info.graphql && info.graphql.user) {
                console.log("user id", info.graphql.user.id);

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
                headers["accept-language"] =
                    "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7";

                let data = {};
                data["pk"] = info.graphql.user.id;
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
                        if (repeat > 0)
                            getUserStories(username, onReady, repeat - 1);
                    });

                //onReady({ id: info.graphql.user.id });
            }
        })
        .catch(function(error) {
            // handle error
            console.log(error);
        });
};
