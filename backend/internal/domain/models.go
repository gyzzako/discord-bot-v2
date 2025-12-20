package domain

// GuildConfig represents configuration for a single guild.
type GuildConfig struct {
	GuildId              string   `json:"guildId"`
	DJRoleID             *string  `json:"djRoleId"`
	AllowedTextChannels  []string `json:"allowedTextChannels"`
	AllowedVoiceChannels []string `json:"allowedVoiceChannels"`
}

// Guild represents basic guild metadata stored in the DB.
type Guild struct {
	GuildId string `json:"guildId"`
	Name    string `json:"name"`
}
