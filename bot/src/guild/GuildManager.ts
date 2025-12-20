import ApiClient from '../api/client';
import type { GuildConfig } from '../api/types';
import { GuildMember, PermissionsBitField } from 'discord.js';

type ConfigEntry = { cfg: GuildConfig; expiresAt: number; refreshTimer?: NodeJS.Timeout };

export class GuildContext {
  public config?: ConfigEntry;
  constructor(public guildId: string) {
  }
}

export class GuildManager {
  private contexts = new Map<string, GuildContext>();
  private apiClient?: ApiClient;
  private configTtlMs = 30_000;

  setProps(client: ApiClient, ttlMs = 30_000) {
    this.apiClient = client;
    this.configTtlMs = ttlMs;
  }

  getContext(guildId: string): GuildContext {
    let c = this.contexts.get(guildId);
    if (!c) {
      c = new GuildContext(guildId);
      this.contexts.set(guildId, c);
    }
    return c;
  }

  removeContext(guildId: string) {
    const c = this.contexts.get(guildId);
    if (c && c.config?.refreshTimer) clearTimeout(c.config.refreshTimer);
    this.contexts.delete(guildId);
  }

  listGuilds(): string[] {
    const out: string[] = [];
    for (const k of this.contexts.keys()) out.push(k);
    return out;
  }

  async getConfig(guildId: string): Promise<GuildConfig | undefined> {
    const c = this.getContext(guildId);
    const now = Date.now();
    if (c.config && c.config.expiresAt > now) return c.config.cfg;
    if (!this.apiClient) return c.config?.cfg;

    try {
      const cfg = await this.apiClient.getGuildConfig(guildId);
      this.setCachedConfig(c, cfg);
      return cfg;
    } catch (err) {
      // return stale config if available
      return c.config?.cfg;
    }
  }

  // Check whether a member is allowed to perform privileged actions.
  async hasPermission(guildId: string, member: GuildMember): Promise<boolean> {
    if (!member) return false;

    // admin bypass
    try {
      if (member.permissions && typeof member.permissions.has === 'function') {
        const p = member.permissions;
        if (p.has(PermissionsBitField.Flags.Administrator) || p.has(PermissionsBitField.Flags.ManageGuild)) return true;
      }
    } catch (_) {}

    const config = await this.getConfig(guildId);
    if (!config || !config.djRoleId) return true;

    return member.roles.cache.has(config.djRoleId);
  }

  invalidateConfig(guildId: string) {
    const c = this.contexts.get(guildId);
    if (!c) return;
    c.config = undefined;
    if (this.apiClient) this.apiClient.invalidateGuildConfig(guildId);
  }

  private setCachedConfig(ctx: GuildContext, cfg: GuildConfig) {
    if (ctx.config?.refreshTimer) clearTimeout(ctx.config.refreshTimer);
    const expiresAt = Date.now() + this.configTtlMs;
    const entry: ConfigEntry = { cfg, expiresAt };
    // schedule refresh 1s before expiry
    entry.refreshTimer = setTimeout(() => {
      this.refreshConfig(ctx.guildId).catch(() => {});
    }, Math.max(1000, this.configTtlMs - 1000));
    ctx.config = entry;
  }

  private async refreshConfig(guildId: string) {
    if (!this.apiClient) return;
    const ctx = this.getContext(guildId);
    try {
      const cfg = await this.apiClient.getGuildConfig(guildId);
      this.setCachedConfig(ctx, cfg);
    } catch (err) {
    }
  }
}

export default GuildManager;
export const guildManager = new GuildManager();
