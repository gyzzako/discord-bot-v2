import { Player } from "lavalink-client";
import { BotClient, CustomRequester } from "../../types/clients";
import { EmbedBuilder, MessageCreateOptions, TextChannel } from "discord.js";
import { formatMS_HHMMSS } from "../../utils/time";

export function loadLavalinkPlayerEvents(client: BotClient) {

    /**
     * Queue/Track Events
     */
    client.lavalink.on("trackStart", (player, track) => {
        const avatarURL = (track?.requester as CustomRequester)?.avatar || undefined;

        const embeds = [
            new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(`🎶 ${track?.info?.title}`.substring(0, 256))
            .setThumbnail(track?.info?.artworkUrl || track?.pluginInfo?.artworkUrl || null)
            .setDescription(
                [
                    `> - **Author:** ${track?.info?.author}`,
                    `> - **Duration:** ${formatMS_HHMMSS(track?.info?.duration || 0)} | Ends <t:${Math.floor((Date.now() + (track?.info?.duration || 0)) / 1000)}:R>`,
                    `> - **Source:** ${track?.info?.sourceName}`,
                    `> - **Requester:** <@${(track?.requester as CustomRequester)?.id}>`,
                    track?.pluginInfo?.clientData?.fromAutoplay ? `> *From Autoplay* ✅` : undefined
                ].filter(v => typeof v === "string" && v.length).join("\n").substring(0, 4096)
            )
            .setFooter({
                text: `Requested by ${(track?.requester as CustomRequester)?.username}`,
                iconURL: /^https?:\/\//.test(avatarURL || "") ? avatarURL : undefined,
            })
            .setTimestamp()
        ];
        // some tracks might have a "uri" which is not a valid http url (e.g. spotify local, files, etc.)
        if(track?.info?.uri && /^https?:\/\//.test(track?.info?.uri)) embeds[0].setURL(track.info.uri)

        sendPlayerMessage(client, player, { embeds });
    })
    .on("queueEnd", (player, track, payload) => {
        sendPlayerMessage(client, player, {
            embeds: [
                new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ Queue Ended")
                .setTimestamp()
            ]
        });
    })

}

async function sendPlayerMessage(client: BotClient, player: Player, messageData: MessageCreateOptions) {
    const channel = client.channels.cache.get(player.textChannelId!) as TextChannel;
    if(!channel) return;

    return channel.send(messageData);
}