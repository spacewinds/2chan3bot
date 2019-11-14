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
        icon_url: "https://i.imgur.com/w3duR07.png"
    }
};

export const generatePost = data => {
    const result = {
        color: data.color ? data.color : 0x0099ff,
        title: data.post.number,
        url: data.post.url,
        author: {
            name: data.thread.name,
            icon_url: data.icon ? data.icon : "https://i.imgur.com/pv5X0p5.png",
            url: data.thread.url
        },
        description: data.post.text,
        thumbnail: data.post.attachment
            ? {
                  url: data.post.attachment
              }
            : undefined,
        timestamp: data.post.date ? data.post.date : new Date(),
        footer: {
            text: data.footerText
        }
    };
    console.log("result", result);
    return result;
};
