import { ChatInputCommandInteraction, GuildMember, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { guildManager } from '../guild/GuildManager';
import { BotClient, Command } from '../types/clients';

export default {
  data: new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Stop playback and clear queue'),
  execute: handleStop,
} as Command;


async function handleStop(client: BotClient, interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId ?? 'unknown';
  // permission check
  const member = interaction.member as GuildMember;
  const allowed = await guildManager.hasPermission(guildId, member);
  if (!allowed) {
    return interaction.reply({ content: 'You do not have permission to stop playback.',  flags: MessageFlags.Ephemeral });
  }
  
  const player = client.lavalink.getPlayer(guildId);
  if (!player) {
    return interaction.reply({ content: 'No music is currently playing.', flags: MessageFlags.Ephemeral });
  }
  
  await player.stopPlaying()
  await player.destroy()

  interaction.reply({ content: 'Playback stopped.' });
}
