import { ChatInputCommandInteraction, Client, GuildMember, MessageFlags } from 'discord.js';
import { guildManager } from '../guild/GuildManager';
const manager = guildManager;

export async function handlePlay(client: Client, interaction: ChatInputCommandInteraction) {
  const url = interaction.options.getString('url');
  if (!url) {
    await interaction.reply({ content: 'You must provide a URL to play.', flags: MessageFlags.Ephemeral });
    return;
  }

  const guildId = interaction.guildId ?? 'unknown';
  const member = interaction.member as GuildMember;
  const allowed = await manager.hasPermission(guildId, member);
  if (!allowed) {
    return interaction.reply({ content: 'You do not have permission to play tracks.', flags: MessageFlags.Ephemeral });
  }

  const voiceChannel = member.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: 'You are not in a voice channel.', flags: MessageFlags.Ephemeral });
  }

  const player = client.lavalink.createPlayer({
    guildId: guildId,
    voiceChannelId: voiceChannel.id,
    textChannelId: interaction.channelId
  });
  
  const results = await player.search({ query: url, source: 'youtube' }, member.user);

  if (!results.tracks.length) return interaction.reply("No tracks found.");

  const track = results.tracks[0];

  const connected = player.connected;
  if (!connected) await player.connect();

  await player.queue.add(track);
  if (!player.playing){
    await player.play()
  }

  interaction.reply(`🎶 Now playing **${track.info.title}**`);
}

export default handlePlay;