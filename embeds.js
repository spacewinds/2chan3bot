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
    return result;
};
