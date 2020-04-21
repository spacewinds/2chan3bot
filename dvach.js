const axios = require("axios");

var catalogData = null;
var currentThreadDesc = null;
var currentThreadData = null;
var lastPostTimeStamp = null;
var newPosts = [];

export const getCatalogData = (general = "bonbi") => {
    return state[general].catalogData;
};
export const getCurrentThreadData = (general = "bonbi") => {
    return state[general].currentThreadData;
};
export const getNewPosts = (general = "bonbi") => {
    return state[general].newPosts;
};

let state = {
    bonbi: {
        catalogData: null,
        currentThreadDesc: null,
        currentThreadData: null,
        lastPostTimeStamp: null,
        newPosts: [],
        keywords: ["бонби", "бoнб"]
    },
    richie: {
        catalogData: null,
        currentThreadDesc: null,
        currentThreadData: null,
        lastPostTimeStamp: null,
        newPosts: [],
        keywords: ["richie"]
    }
};

const checkSubject = (subject, keywords) => {
    let result = false;
    keywords.forEach(k => {
        if (subject.includes(k)) {
            result = true;
        }
    });
    return result;
};

export const getCurrentThreadDesc = (general = "bonbi") => {
    if (state[general].currentThreadDesc === null) {
        findCurrentThread(general);
    }
    return state[general].currentThreadDesc;
};

export const findBonbiThreadsSubjects = general => {
    const cat = getCatalogData(general);
    let threads = [];
    let list = [];
    if (cat) {
        if (cat.threads)
            cat.threads.forEach(item => {
                if (
                    checkSubject(
                        item.subject.toLowerCase(),
                        state[general].keywords
                    )
                ) {
                    threads.push(item);
                    list.push(item.subject);
                }
            });
    }
    return threads;
};

export const findCurrentThread = (general = "bonbi") => {
    const threads = findBonbiThreadsSubjects(general);
    //console.log("findCurrentThread", threads);
    if (threads && threads.length > 0) {
        state[general].currentThreadDesc = threads[0];
        return state[general].currentThreadDesc;
    }
};

export const reloadThread = (general = "bonbi") => {
    if (state[general].currentThreadDesc) {
        axios
            .get(
                "https://2ch.hk/fag/res/" +
                    state[general].currentThreadDesc.num +
                    ".json"
            )
            .then(function(response) {
                state[general].currentThreadData = response.data;
                //console.log("reload thread success");
            })
            .catch(function(error) {
                // handle error
                console.log(error);
            });
    } else {
        console.log("No current thread");
    }
};

export const findNewPosts = (general = "bonbi") => {
    if (!state[general].currentThreadData) return;
    if (!state[general].currentThreadData.threads) return;
    if (!state[general].currentThreadData.threads[0]) return;
    const data = state[general].currentThreadData.threads[0].posts;
    if (!state[general].lastPostTimeStamp) {
        state[general].lastPostTimeStamp = data[data.length - 1].timestamp;
        state[general].newPosts = [data[data.length - 1]];
    } else {
        state[general].newPosts = [];
        data.forEach(item => {
            if (item.timestamp > state[general].lastPostTimeStamp) {
                state[general].lastPostTimeStamp = item.timestamp;
                state[general].newPosts.push(item);
            }
        });
    }
};

export const reloadCatalog = (general = "bonbi") => {
    axios
        .get("https://2ch.hk/fag/catalog.json")
        .then(function(response) {
            state[general].catalogData = response.data;
        })
        .catch(function(error) {
            // handle error
            console.log(error);
        });
};
