import { ChatInputCommandInteraction, GuildMember, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { guildManager } from '../guild/GuildManager';
import { BotClient, Command } from '../types/clients';

export default {
  data: new SlashCommandBuilder()
      .setName('play')
      .setDescription('Play a song')
      .addStringOption((opt) => opt.setName('query').setDescription('name or URL').setRequired(true)),
  execute: handlePlay,
} as Command;

async function handlePlay(client: BotClient, interaction: ChatInputCommandInteraction) {
  const query = interaction.options.getString('query');
  if (!query) {
    return interaction.reply({ content: 'You must provide song to play.', flags: MessageFlags.Ephemeral });
  }

  const guildId = interaction.guildId ?? 'unknown';
  const member = interaction.member as GuildMember;
  const allowed = await guildManager.hasPermission(guildId, member);
  if (!allowed) {
    return interaction.reply({ content: 'You do not have permission to play tracks.', flags: MessageFlags.Ephemeral });
  }

  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: 'You are not in a voice channel.', flags: MessageFlags.Ephemeral });
  }

  const player = client.lavalink.createPlayer({
    guildId: guildId,
    voiceChannelId: voiceChannel.id,
    textChannelId: interaction.channelId
  });
  
  const results = await player.search({ query: query, source: 'youtube' }, member.user);

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