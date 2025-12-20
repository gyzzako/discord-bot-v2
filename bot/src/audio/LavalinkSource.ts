
import { Client } from "discord.js";
import { LavalinkManager } from "lavalink-client";

// Extend the Client type to include the lavalink manager
declare module "discord.js" {
  interface Client {
    lavalink: LavalinkManager;
  }
}

export const getLavalinkManager = (client: Client) => {
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
