import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { BotClient, Command } from '../types/clients';

export default {
  data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Ping the bot'),
  execute: handlePing,
} as Command;

async function handlePing(client: BotClient, interaction: ChatInputCommandInteraction) {
  interaction.reply('Pong!');
}
