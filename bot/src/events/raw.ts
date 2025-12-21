import { Events } from "discord.js";
import { BotClient, Event } from "../types/clients";

export default {
    name: Events.Raw,
    execute: async (client: BotClient, data: any) => {
        client.lavalink.sendRawData(data)
    }
} as Event