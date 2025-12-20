import { ChatInputCommandInteraction, Client, GuildMember, MessageFlags } from 'discord.js';
import { guildManager } from '../guild/GuildManager';

const manager = guildManager;

export async function handleStop(client: Client, interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId ?? 'unknown';
  // permission check
  const member = interaction.member as GuildMember;
  const allowed = await manager.hasPermission(guildId, member);
  if (!allowed) {
    return interaction.reply({ content: 'You do not have permission to stop playback.',  flags: MessageFlags.Ephemeral });
  }
  
  const player = client.lavalink.getPlayer(guildId);
  if (!player) {
    return interaction.reply({ content: 'No music is currently playing.', flags: MessageFlags.Ephemeral });
  }
  
  player.stopPlaying()
  player.destroy()

  interaction.reply({ content: 'Playback stopped.' });
}

export default handleStop;
