import { ChatInputCommandInteraction, Events, Interaction, InteractionType, MessageFlags } from "discord.js";
import { BotClient, Event } from "../types/clients";
import logger from "../logging";

export default {
    name: Events.InteractionCreate,
    execute: onInteraction
} as Event

async function onInteraction(client: BotClient, interaction: Interaction) {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return logger.error(`No command matching ${interaction.commandName} was found.`);

    try {
        if (interaction.isCommand()) {
            return await command.execute(client, interaction as ChatInputCommandInteraction);
        }
    } catch (error) {
        logger.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ flags: [MessageFlags.Ephemeral], content: 'There was an error while executing this command!' });
        } else {
            await interaction.reply({ flags: [MessageFlags.Ephemeral], content: 'There was an error while executing this command!' });
        }
    }
}