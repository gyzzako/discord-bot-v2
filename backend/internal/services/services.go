package services

import "discord-bot-backend/internal/domain"

// GuildService defines operations for guild-scoped configuration.
type GuildService interface {
	// GetConfig returns the stored GuildConfig for the given guildId.
	GetConfig(guildId string) (domain.GuildConfig, error)

	// PutConfig stores the provided GuildConfig for the given guildId.
	PutConfig(guildId string, cfg domain.GuildConfig) error

	// CreateNewGuild ensures the guild and default records exist, returning the current config.
	CreateNewGuild(g domain.Guild) (domain.GuildConfig, error)
}
