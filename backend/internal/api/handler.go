package api

import (
	"net/http"

	"discord-bot-backend/internal/api/guild"
	"discord-bot-backend/internal/api/guild_config"
)

type Handler struct {
	GuildHandler       *guild.GuildHandler
	GuildConfigHandler *guild_config.GuildConfigHandler
}

// RegisterRoutes registers the routes on the provided mux using the provided handler.
func RegisterRoutes(mux *http.ServeMux, handler *Handler) {
	mux.HandleFunc("POST /guilds/{guildId}", handler.GuildHandler.Post)
	mux.HandleFunc("GET /guilds/{guildId}/config", handler.GuildConfigHandler.Get)
	mux.HandleFunc("PUT /guilds/{guildId}/config", handler.GuildConfigHandler.Put)

	mux.HandleFunc("/health", healthHandler)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok"))
}
