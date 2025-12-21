import { ChatInputCommandInteraction, GuildMember, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { guildManager } from '../guild/GuildManager';
import { BotClient, Command } from '../types/clients';
import { Queue, SearchResult, UnresolvedSearchResult } from 'lavalink-client';

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
    return interaction.reply({ content: 'You must provide song to play', flags: MessageFlags.Ephemeral });
  }

  const guildId = interaction.guildId ?? 'unknown';
  const member = interaction.member as GuildMember;
  const allowed = await guildManager.hasPermission(guildId, member);
  if (!allowed) {
    return interaction.reply({ content: 'You do not have permission to play tracks', flags: MessageFlags.Ephemeral });
  }

  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: 'You are not in a voice channel', flags: MessageFlags.Ephemeral });
  }

  const player = client.lavalink.createPlayer({
    guildId: guildId,
    voiceChannelId: voiceChannel.id,
    textChannelId: interaction.channelId,
    volume: 100
  });
  
  const results = await player.search({ query: query, source: 'youtube' }, member.user);

  if (!results.tracks.length) return interaction.reply({ content: "No tracks found", flags: MessageFlags.Ephemeral });

  const track = results.tracks[0];

  const connected = player.connected;
  if (!connected) await player.connect();

  await player.queue.add(results.loadType === "playlist" ? results.tracks : results.tracks[0]);

  await interaction.reply({
      content: results.loadType === "playlist"
          ? addedInQueueMessage(results, player.queue)
          : addedSingleTrackMessage(results, player.queue)
  });

  if (!player.playing){
    await player.play(connected ? { volume: 50, paused: false } : undefined)
  }
}

function addedInQueueMessage(results: UnresolvedSearchResult | SearchResult, playerQueue: Queue) {
  return `✅ Added [${results.tracks.length}] Tracks${results.playlist?.title ? ` - from the ${results.pluginInfo.type || "Playlist"} ${results.playlist.uri ? `[\`${results.playlist.title}\`](<${results.playlist.uri}>)` : `\`${results.playlist.title}\``}` : ""} at \`#${playerQueue.tracks.length - results.tracks.length}\``;
}

function addedSingleTrackMessage(results: UnresolvedSearchResult | SearchResult, playerQueue: Queue) {
  return `✅ Added [\`${results.tracks[0].info.title}\`](<${results.tracks[0].info.uri}>) by \`${results.tracks[0].info.author}\` at \`#${playerQueue.tracks.length}\``
}