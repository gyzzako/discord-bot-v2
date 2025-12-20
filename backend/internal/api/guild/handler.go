package guild

import (
	"discord-bot-backend/internal/domain"
	"discord-bot-backend/internal/services"
	"encoding/json"
	"net/http"
)

type GuildHandler struct {
	Service services.GuildService
}

// Post creates a new guild in the database if it doesn't exist yet and returns the guild config.
func (h *GuildHandler) Post(w http.ResponseWriter, r *http.Request) {
	var g domain.Guild
	if err := json.NewDecoder(r.Body).Decode(&g); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}
	cfg, err := h.Service.CreateNewGuild(g)
	if err != nil {
		http.Error(w, "failed to ensure guild", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(cfg)
}
