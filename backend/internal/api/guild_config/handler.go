package guild_config

import (
	"discord-bot-backend/internal/domain"
	"discord-bot-backend/internal/services"
	"encoding/json"
	"net/http"
)

type GuildConfigHandler struct {
	Service services.GuildService
}

// Get returns the guild config for the given guild id.
func (h *GuildConfigHandler) Get(w http.ResponseWriter, r *http.Request) {
	guildId := r.PathValue("guildId")

	cfg, err := h.Service.GetConfig(guildId)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(cfg)
}

// Put updates the guild config for the given guild id.
func (h *GuildConfigHandler) Put(w http.ResponseWriter, r *http.Request) {
	guildId := r.PathValue("guildId")

	var cfg domain.GuildConfig
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if err := h.Service.PutConfig(guildId, cfg); err != nil {
		http.Error(w, "failed to store config", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
