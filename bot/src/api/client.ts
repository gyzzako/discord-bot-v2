import fetch, { RequestInit, Response } from 'node-fetch';

import { Guild, GuildConfig } from './types';

type CacheEntry<T> = { value: T; expiresAt: number };

export interface ApiClientOptions {
  timeoutMs?: number;
  retries?: number;
  cacheTtlMs?: number;
}

export class ApiClient {
  private timeoutMs: number;
  private retries: number;
  private cacheTtlMs: number;
  private cache = new Map<string, CacheEntry<any>>();

  constructor(private baseUrl: string, opts: ApiClientOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 5000;
    this.retries = opts.retries ?? 1;
    this.cacheTtlMs = opts.cacheTtlMs ?? 5000;
  }

  private cacheKey(method: string, path: string) {
    return `${method.toUpperCase()}:${path}`;
  }

  private getFromCache<T>(key: string): T | null {
    const e = this.cache.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return e.value as T;
  }

  private setCache<T>(key: string, value: T) {
    this.cache.set(key, { value, expiresAt: Date.now() + this.cacheTtlMs });
  }

  private async doRequest(path: string, init: RequestInit = {}, retriesLeft = this.retries): Promise<Response> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.status >= 500 && retriesLeft > 0) {
        await new Promise((r) => setTimeout(r, 100 * (this.retries - retriesLeft + 1)));
        return this.doRequest(path, init, retriesLeft - 1);
      }
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  async getGuildConfig(guildId: string): Promise<GuildConfig> {
    const path = `/guilds/${guildId}/config`;
    const key = this.cacheKey('GET', path);
    const cached = this.getFromCache<GuildConfig>(key);
    if (cached) return cached;

    const res = await this.doRequest(path, { method: 'GET' });
    if (!res.ok) throw new Error(`request failed: ${res.status}`);
    const body = (await res.json()) as GuildConfig;
    this.setCache(key, body);
    return body;
  }

  async putGuildConfig(guildId: string, cfg: GuildConfig): Promise<void> {
    const path = `/guilds/${guildId}/config`;
    const res = await this.doRequest(path, { method: 'PUT', body: JSON.stringify(cfg), headers: { 'Content-Type': 'application/json' } });
    if (res.status !== 204) throw new Error(`put failed: ${res.status}`);
    // invalidate cache
    this.cache.delete(this.cacheKey('GET', path));
  }

  invalidateGuildConfig(guildId: string) {
    const path = `/guilds/${guildId}/config`;
    this.cache.delete(this.cacheKey('GET', path));
  }

  async ensureGuild(guild: Guild): Promise<GuildConfig> {
    const path = '/guilds/ensure';
    const res = await this.doRequest(path, { method: 'POST', body: JSON.stringify(guild), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`ensure guild failed: ${res.status}`);
    return (await res.json()) as GuildConfig;
  }
}

export default ApiClient;
