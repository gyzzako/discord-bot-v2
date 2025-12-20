export interface Guild {
  guildId: string;
  name: string;
}

export interface GuildConfig {
  guildId: string;
  djRoleId?: string;
  allowedTextChannels: string[];
  allowedVoiceChannels: string[];
}

