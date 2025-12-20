package api

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"discord-bot-backend/internal/api/guild"
	"discord-bot-backend/internal/api/guild_config"
	"discord-bot-backend/internal/database"
	"discord-bot-backend/internal/domain"
	"discord-bot-backend/internal/services"

	_ "modernc.org/sqlite"
)

func TestRegisterRoutes_HealthAndGuildConfig(t *testing.T) {
	mux := http.NewServeMux()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite db: %v", err)
	}
	defer db.Close()
	if err := database.ApplyMigrations(db, "sqlite3", "../../migrations"); err != nil {
		t.Fatalf("failed to apply migrations: %v", err)
	}
	svc := services.NewSQLiteGuildServiceFromDB(db)
	// pre-populate a config for guild 123 (with DJ role for permissions endpoint)
	djRole := "u1"
	_ = svc.PutConfig("123", domain.GuildConfig{DJRoleID: &djRole, AllowedTextChannels: []string{}, AllowedVoiceChannels: []string{}})
	guildHandler := &guild.GuildHandler{Service: svc}
	guildConfigHandler := &guild_config.GuildConfigHandler{Service: svc}
	RegisterRoutes(mux, &Handler{
		GuildHandler:       guildHandler,
		GuildConfigHandler: guildConfigHandler,
	})

	tests := []struct {
		name       string
		method     string
		path       string
		wantStatus int
	}{
		{"health", http.MethodGet, "/health", http.StatusOK},
		{"get config", http.MethodGet, "/guilds/123/config", http.StatusOK},
		{"put config", http.MethodPut, "/guilds/123/config", http.StatusNoContent},

		{"unknown path", http.MethodGet, "/guilds/", http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var bodyReader *bytes.Reader
			if tt.method == http.MethodPut {
				bodyReader = bytes.NewReader([]byte(`{"allowedTextChannels":[],"allowedVoiceChannels":[]}`))
			}
			var req *http.Request
			if bodyReader != nil {
				req = httptest.NewRequest(tt.method, tt.path, bodyReader)
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}
			rr := httptest.NewRecorder()
			mux.ServeHTTP(rr, req)

			if rr.Code != tt.wantStatus {
				t.Fatalf("%s: expected status %d, got %d", tt.name, tt.wantStatus, rr.Code)
			}

			if tt.name == "health" {
				if body := rr.Body.String(); body != "ok" {
					t.Fatalf("health: expected body 'ok', got %q", body)
				}
			}

			if tt.name == "get config" {
				var m map[string]interface{}
				if err := json.NewDecoder(rr.Body).Decode(&m); err != nil {
					t.Fatalf("decode json: %v", err)
				}
				if m["guildId"] != "123" {
					t.Fatalf("expected guildId 123, got %v", m["guildId"])
				}
			}

		})
	}
}
