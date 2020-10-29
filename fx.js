const Discord = require("discord.js");
const sharp = require("sharp");
import { downloadURL } from "./tiktok";

export const lukoshko = (channel, url) => {
    downloadURL(
        "https://cdn.discordapp.com/attachments/646718856790016000/662106977723351064/15752697505550.jpg",
        backBuffer => {
            downloadURL(url, buffer => {
                const width = 112,
                    r = width / 2,
                    circleShape = Buffer.from(
                        `<svg width="112" height="112">
                              <defs>
                                <clipPath id="cut-off-bottom">
                                  <polygon points="16 45, 0 19, 0 0, 99 0, 100 63, 40 56, 24 52" fill="none" stroke="black"/>
                                </clipPath>
                              </defs>
                              <circle cx="50" cy="50" r="50" clip-path="url(#cut-off-bottom)" />
                         </svg>`
                    );

                sharp(buffer)
                    .resize(width, width)
                    .composite([
                        {
                            input: circleShape,
                            blend: "dest-in"
                        }
                    ])
                    .png()
                    .toBuffer((err, data, info) => {
                        console.log(err, info);
                        if (data) {
                            sharp(backBuffer)
                                .composite([
                                    {
                                        input: data,
                                        blend: "over",
                                        left: 212,
                                        top: 197
                                    }
                                ])
                                .png()
                                .toBuffer((err2, data2, info2) => {
                                    console.log(err2, info2);
                                    channel.send(
                                        "",
                                        new Discord.MessageAttachment(
                                            data2,
                                            "lukoshko.png"
                                        )
                                    );
                                });
                        }
                    });
            });
        }
    );
};
