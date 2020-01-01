const axios = require("axios");

var catalogData = null;
var currentThreadDesc = null;
var currentThreadData = null;
var lastPostTimeStamp = null;
var newPosts = [];

export const getCatalogData = () => catalogData;
export const getCurrentThreadData = () => currentThreadData;
export const getNewPosts = () => newPosts;

export const getCurrentThreadDesc = () => {
    if (currentThreadDesc === null) {
        findCurrentThread();
    }
    return currentThreadDesc;
};

//
export const findBonbiThreadsSubjects = (listOnly = false, key = "бонби", keyAlt = "бoнб") => {
    const cat = getCatalogData();
    let threads = [];
    let list = [];
    if (cat) {
        cat.threads.forEach(item => {
            if (item.subject.toLowerCase().includes(key) || item.subject.toLowerCase().includes(keyAlt)) {
                threads.push(item);
                list.push(item.subject);
            }
        });
    }
    return listOnly ? list : threads;
};

export const findCurrentThread = () => {
    const threads = findBonbiThreadsSubjects();
    //console.log("findCurrentThread", threads);
    if (threads && threads.length > 0) {
        currentThreadDesc = threads[0];
        return currentThreadDesc;
    }
};

export const reloadThread = () => {
    if (currentThreadDesc) {
        axios
            .get("https://2ch.hk/fag/res/" + currentThreadDesc.num + ".json")
            .then(function(response) {
                currentThreadData = response.data;
                console.log("reload thread success");
            })
            .catch(function(error) {
                // handle error
                console.log(error);
            });
    } else {
        console.log("No current thread");
    }
};

export const findNewPosts = () => {
    if (!currentThreadData) return;
	if (!currentThreadData.threads) return;
	if (!currentThreadData.threads[0]) return;
    const data = currentThreadData.threads[0].posts;
    if (!lastPostTimeStamp) {
        lastPostTimeStamp = data[data.length - 1].timestamp;
        newPosts = [data[data.length - 1]];
    } else {
        newPosts = [];
        data.forEach(item => {
            if (item.timestamp > lastPostTimeStamp) {
                lastPostTimeStamp = item.timestamp;
                newPosts.push(item);
            }
        });
    }
};

export const reloadCatalog = () => {
    axios
        .get("https://2ch.hk/fag/catalog.json")
        .then(function(response) {
            catalogData = response.data;
        })
        .catch(function(error) {
            // handle error
            console.log(error);
        });
};
