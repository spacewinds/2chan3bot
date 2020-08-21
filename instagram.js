const axios = require("axios");
const Instagram = require("instagram-web-api");
let xmlParser = require("xml2json");
const client = new Instagram({ username: "username", password: "password" });

/*
export const getInstaUser = async (username, callback) => {
    const instagramUser = await client.getUserByUsername({ username });
    console.log("insta user", instagramUser);
    if (callback) callback(instagramUser);
};

getInstaUser("honey_cot");*/

export const getUserStories = (user, onReady) => {
  axios
    .get(`https://storiesig.com/stories/${user}`)
    .then((data) => {
      let object = JSON.parse(xmlParser.toJson(data.data));
      try {
        const result = object.html.body.div.div.section.div.article;
        onReady(result);
      } catch (err) {
        console.log("insta broken");
      }

      fs.writeFile("data", object);
    })
    .catch((error) => {
      console.log("ERROR", error);
    });
};
