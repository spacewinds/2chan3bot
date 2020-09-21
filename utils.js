var moment = require("moment");

export const jsonCopy = src => {
    return JSON.parse(JSON.stringify(src));
};

export const formatDate = (date, isTime = false) => {
    if (isTime) {
        return moment().format();
    }
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    var day = date.getDay();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var seconds = date.getSeconds();

    return (
        day +
        " " +
        monthNames[monthIndex] +
        " " +
        year +
        (isTime ? " " + hour + ":" + minute + "::" + seconds : "")
    );
};

export const findNode = (id, currentNode) => {
    var i, currentChild, result;
    result = [];

    if (id == currentNode.class) {
        result.push(currentNode);
    } else {
        Object.keys(currentNode).forEach(key => {
            currentChild = currentNode[key];
            if (typeof currentChild === "object") {
                const innerData = findNode(id, currentChild);
                innerData.forEach(item => {
                    result.push(item);
                });
            }
        });
    }
    return result;
};

export const getUrlExtension = url => {
    return url
        .split(/[#?]/)[0]
        .split(".")
        .pop()
        .trim();
};
