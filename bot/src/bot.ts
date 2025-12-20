import ApiClient from './api/client';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, InteractionType, Guild } from 'discord.js';
import logger from './logging';
import { handlePing } from './commands/ping';
import { guildManager } from './guild/GuildManager';
import { getLavalinkManager } from './audio/LavalinkSource';
import { BotClientOptions } from 'lavalink-client';


let _client: Client | null = null;

export async function initBot(): Promise<void> {
  const baseUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';
  const clientApi = new ApiClient(baseUrl);
  logger.info(`Using backend ${baseUrl}`);
  
  const cfgTtl = process.env.BACKEND_CONFIG_TTL_MS ? parseInt(process.env.BACKEND_CONFIG_TTL_MS, 10) : undefined;
  guildManager.setProps(clientApi, cfgTtl);

  const token = process.env.DISCORD_TOKEN;
  const appId = process.env.DISCORD_APP_ID;

  if (!token || !appId) {
    logger.warn('DISCORD_TOKEN or DISCORD_APP_ID not set — skipping Discord client startup');
    return;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
  client.lavalink = getLavalinkManager(client);

  client.once('clientReady', async () => {
    logger.info('Discord client ready —', client.user!.tag);

    // Initialize the Lavalink client
    client.lavalink.init({ ...client.user } as BotClientOptions);

    const rest = new REST({ version: '10' }).setToken(token);
    const pingCmd = new SlashCommandBuilder().setName('ping').setDescription('Ping the bot');
    const playCmd = new SlashCommandBuilder().setName('play').setDescription('Play a URL').addStringOption((opt) => opt.setName('url').setDescription('URL to play').setRequired(true));
    const stopCmd = new SlashCommandBuilder().setName('stop').setDescription('Stop playback and clear queue');

    try {
      const cmds = [pingCmd.toJSON(), playCmd.toJSON(), stopCmd.toJSON()];
      await rest.put(Routes.applicationCommands(appId), { body: cmds });
      logger.info('Registered global commands');
    } catch (err) {
      logger.error('Failed registering commands:', err);
    }
  });

  client.on("raw", (d) => client.lavalink.sendRawData(d));

  client.on('interactionCreate', async (interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;
    if (name === 'ping') {
      await handlePing(interaction);
      return;
    }

    if (name === 'play') {
      const { handlePlay } = await import('./commands/play');
      await handlePlay(client, interaction);
      return;
    }

    if (name === 'stop') {
      const { handleStop } = await import('./commands/stop');
      await handleStop(client, interaction);
      return;
    }
  });

  client.on('guildCreate', async (guild: Guild) => {
    try {
      await clientApi.ensureGuild({ guildId: guild.id, name: guild.name });
      logger.info(`Ensured guild: ${guild.name} (${guild.id})`);
    } catch (error) {
      logger.error(`Failed to ensure guild ${guild.id}:`, error);
    }
  });

  client.login(token).catch((err) => logger.error('Failed to login Discord client:', err));
  _client = client;
}

export async function shutdown(): Promise<void> {
  if (!_client) return;

  try {
    // Stop all players
    if (guildManager) {
      for (const gid of guildManager.listGuilds()) {
        const player = _client.lavalink.getPlayer(gid);
        if (!player) {
          continue
        }
        await player.stopPlaying()
        await player.destroy()
      }
    }

    await _client.destroy();
    logger.info('Discord client destroyed');
   
    _client = null;
  } catch (err) {
    logger.error('Error during shutdown:', err);
  }
}