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
