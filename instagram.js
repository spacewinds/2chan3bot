const axios = require("axios");
const Instagram = require("instagram-web-api");
let xmlParser = require("xml2json");
var html2json = require("html2json").html2json;
import { findNode, getUrlExtension } from "./utils";

axios
    .get(
        "https://www.instagram.com/web/search/topsearch/?context=blended&query=honey_cot&include_reel=false&count=50"
    )
    .then(response => {
        console.log("HONEY COT RESPNSE", response);
    })
    .catch(error => {
        console.log("HONEY COT RESPNSE", error);
    });

function instaDPFormat(data) {
    let result = [];
    data.forEach(item => {
        if (getUrlExtension(item.href).toLowerCase() === "jpg") {
            result.push({ img: { src: item.href } });
        } else {
            result.push({ video: { src: item.href } });
        }
    });
    return result;
}

export const getUserStories_DP = (user, onReady) => {
    axios
        .get(`https://www.instadp.com/stories/${user}`)
        .then(data => {
            let object = html2json(data.data);
            let jsons = JSON.stringify(object);
            try {
                const result = instaDPFormat(findNode("download-btn", object));
                console.log("result");
                onReady(result);
            } catch (err) {
                console.log("insta broken/DP");
            }
        })
        .catch(error => {
            console.log("ERROR", error);
        });
};

export const getUserStories = (user, onReady) => {
    axios
        .get(`https://storiesig.com/stories/${user}`)
        .then(data => {
            let object = JSON.parse(xmlParser.toJson(data.data));
            try {
                const result = object.html.body.div.div.section.div.article;
                onReady(result);
            } catch (err) {
                getUserStories_DP(user, onReady);
                console.log("insta broken");
            }
        })
        .catch(error => {
            getUserStories_DP(user, onReady);
            console.log("ERROR", error);
        });
};
