export const exampleEmbed = {
    color: 0x0099ff,
    title: "№8981808",
    url: "https://ya.ru",
    author: {
        name: "Бонби тред №463",
        icon_url: "https://i.imgur.com/w3duR07.png",
        url: "https://discord.js.org"
    },
    description:
        "Some description hereSome description hereSome description hereSome description hereSome \
        description hereSome description hereSome description hereSome description\
        hereSome description hereSome description hereSome description here",
    thumbnail: {
        url: "https://2ch.hk/fag/src/8981593/15737391612070.png"
    },
    timestamp: new Date(),
    footer: {
        text: "",
        icon_url: "https://i.imgur.com/w3duR07.png",
        url: "https://ya.ru"
    }
};

export const generatePost = data => {
    const result = {
        color: data.color ? data.color : 0x0099ff,
        title: data.thread.name + " #" + data.post.number,
        url: data.post.url,
        description: data.post.text,
        thumbnail: data.post.attachment
            ? {
                  url: data.post.attachment
              }
            : undefined,
        timestamp: data.post.date ? data.post.date : new Date(),
        footer: {
            text: data.footerText,
            url: "https://ya.ru"
        }
    };
    console.log("result", result);
    return result;
};
