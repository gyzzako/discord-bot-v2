import ApiClient from './api/client';
import { Client, GatewayIntentBits } from 'discord.js';
import logger from './logging';
import { loadCommands, loadEvents } from "./handler";
import { guildManager } from './guild/GuildManager';
import { getLavalinkManager } from './audio/LavalinkSource';
import { BotClient } from './types/clients';
import { loadLavalinkPlayerEvents } from './lavalink/event';


let _client: BotClient | null = null;

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

  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] }) as BotClient;
  client.lavalink = getLavalinkManager(client);
  client.apiClient = clientApi;

  loadCommands(client);
  loadEvents(client);
  loadLavalinkPlayerEvents(client);

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