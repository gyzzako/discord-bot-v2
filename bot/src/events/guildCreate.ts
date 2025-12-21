import { Events, Guild } from "discord.js";
import { BotClient, Event } from "../types/clients";
import logger from "../logging";

export default {
    name: Events.GuildCreate,
    execute: onCreate
} as Event

async function onCreate(client: BotClient, guild: Guild) {
    try {
      await client.apiClient.ensureGuild({ guildId: guild.id, name: guild.name });
      logger.info(`Ensured guild: ${guild.name} (${guild.id})`);
    } catch (error) {
      logger.error(`Failed to ensure guild ${guild.id}:`, error);
    }
}