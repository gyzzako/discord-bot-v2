import { LavalinkManager } from "lavalink-client";
import { BotClient } from "../types/clients";

export const getLavalinkManager = (client: BotClient) => {
  return new LavalinkManager({
    nodes: [
      {
        authorization: process.env.LAVALINK_PASSWORD ?? "",
        host: process.env.LAVALINK_HOST ?? "localhost",
        port: process.env.LAVALINK_PORT ? parseInt(process.env.LAVALINK_PORT, 10) : 2303,
        id: process.env.LAVALINK_ID,
        secure: false
      }
    ],
    sendToShard: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    },
    autoSkip: true,
    client: {
      id: process.env.DISCORD_APP_ID ?? "",
      username: process.env.DISCORD_BOT_NAME,
    },
  });
}
