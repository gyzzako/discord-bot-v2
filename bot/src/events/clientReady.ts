import { ApplicationCommandDataResolvable, Events, REST, Routes } from "discord.js";
import { BotClient, Event } from "../types/clients";
import logger from "../logging";
import { BotClientOptions } from "lavalink-client";

export default {
    name: Events.ClientReady,
    once: true,
    execute: onceReady
} as Event

async function onceReady(client: BotClient) {
    await client.lavalink.init({ ...client.user! } as BotClientOptions);
    
    try {
        const cmds: ApplicationCommandDataResolvable[] = [];
        client.commands.forEach((command, name) => cmds.push(command.data.toJSON()));
        
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN ?? "");
        await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID ?? ""), { body: cmds });
        logger.info('Registered global commands');
    } catch (err) {
        logger.error('Failed registering commands:', err);
    }

    logger.info('Discord client ready —', client.user!.tag);
}