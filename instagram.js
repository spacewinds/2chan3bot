const axios = require("axios");

export const getUserStories = (username, onReady, repeat = 3) => {
    const pk = null;
    axios
        .get("https://instagram.com/" + username + "/?__a=1")
        .then(function(response) {
            const info = response.data;
            if (info.graphql && info.graphql.user) {
                console.log("user id", info.graphql.user.id);

                axios
                    .post(
                        "https://api.insta-stories.ru/profile",
                        {
                            pk: info.graphql.user.id
                        },
                        {
                            headers: {
                                origin: "https://insta-stories.ru",
                                referer: "https://insta-stories.ru/" + username
                            },
                            timeout: 5000
                        }
                    )
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
